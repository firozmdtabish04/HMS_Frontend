import { Component, OnInit } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Prescription } from 'src/app/models/prescription';
import { Appointment } from 'src/app/models/appointment';
import { Doctor } from 'src/app/models/doctor';
import { UserService } from 'src/app/services/user.service';
import { DoctorService } from 'src/app/services/doctor.service';

@Component({
  standalone: false,
  selector: 'app-prescriptionlist',
  templateUrl: './prescriptionlist.component.html',
  styleUrls: ['./prescriptionlist.component.css']
})
export class PrescriptionlistComponent implements OnInit {
  prescriptionlist: Observable<Prescription[]> | undefined;
  prescriptionsList: Prescription[] = [];
  name: string = '';
  loggedUser: string = '';
  currRole: string = '';

  showSearchCard = true;
  showPrescriptionPages = false;
  hasSearched = false;
  isLoading = false;
  searchError = '';

  // Doctor lookup map to resolve email to real name
  doctorMap: { [key: string]: string } = {};

  // Update prescription features
  editingPrescription: Prescription | null = null;
  editDoctorName = '';
  editDisease = '';
  editPrescriptionText = '';
  editAdmissionStatus = '';
  isUpdating = false;
  updateSuccessMessage = '';
  updateErrorMessage = '';

  constructor(
    private _service: UserService,
    private doctorService: DoctorService
  ) { }

  ngOnInit(): void {
    this.loggedUser = sessionStorage.getItem('loggedUser') || '';
    this.currRole = (sessionStorage.getItem('ROLE') || '').toLowerCase();

    // Cache doctors list to resolve doctor emails to real doctor names
    this.doctorService.getDoctorList().subscribe({
      next: (docs: Doctor[]) => {
        if (docs) {
          docs.forEach(doc => {
            if (doc.email && doc.doctorname) {
              this.doctorMap[doc.email.toLowerCase()] = doc.doctorname;
            }
            if (doc.doctorname) {
              this.doctorMap[doc.doctorname.toLowerCase()] = doc.doctorname;
            }
          });
        }
      },
      error: () => {}
    });

    // If logged in as patient / user, automatically show prescriptions according to their gmail
    if (this.loggedUser && (this.currRole === 'user' || this.currRole === 'patient')) {
      this.name = this.loggedUser;
      this.searchPrescription();
    } else {
      this.showSearchCard = true;
      this.showPrescriptionPages = false;
    }
  }

  searchMyPrescriptions(): void {
    if (!this.loggedUser) return;
    this.name = this.loggedUser;
    this.searchPrescription();
  }

  searchPrescription(): void {
    const query = this.name?.trim();

    if (!query) {
      this.searchError = 'Please enter a patient name or Gmail address.';
      return;
    }

    this.searchError = '';
    this.isLoading = true;
    this.hasSearched = true;

    if (query.includes('@')) {
      // Search by Gmail / Email
      this._service.getPrescriptionsByEmail(query).pipe(
        catchError(() => of([]))
      ).subscribe({
        next: (prescriptions: Prescription[]) => {
          if (prescriptions && prescriptions.length > 0) {
            this.handleSearchResults(prescriptions);
          } else {
            // Fallback: look up patient appointments for this email
            this.doctorService.getPatientListByEmail(query).pipe(
              catchError(() => of([]))
            ).subscribe({
              next: (appointments: Appointment[]) => {
                const names = Array.from(new Set(
                  (appointments || [])
                    .map(a => a.patientname?.trim())
                    .filter((n): n is string => !!n)
                ));

                if (names.length === 0) {
                  // Direct name check with email string
                  this._service.getPrescriptionsByName(query).pipe(
                    catchError(() => of([]))
                  ).subscribe({
                    next: (res) => this.handleSearchResults(res || [])
                  });
                  return;
                }

                // Query prescriptions for each associated patient name
                const requests = names.map(n => this._service.getPrescriptionsByName(n).pipe(catchError(() => of([]))));
                forkJoin(requests).subscribe({
                  next: (results: Prescription[][]) => {
                    const combined = results.reduce((acc, curr) => acc.concat(curr), []);
                    this.handleSearchResults(combined);
                  },
                  error: () => {
                    this.handleSearchResults([]);
                  }
                });
              },
              error: () => {
                this.handleSearchResults([]);
              }
            });
          }
        },
        error: () => {
          this.handleSearchResults([]);
        }
      });
    } else {
      // Search by Patient Name
      this._service.getPrescriptionsByName(query).pipe(
        catchError(() => of([]))
      ).subscribe({
        next: (prescriptions: Prescription[]) => {
          this.handleSearchResults(prescriptions || []);
        },
        error: () => {
          this.handleSearchResults([]);
        }
      });
    }
  }

  private handleSearchResults(prescriptions: Prescription[]): void {
    this.isLoading = false;
    const cleanList = this.cleanAndDeduplicate(prescriptions);
    this.prescriptionsList = cleanList;
    this.prescriptionlist = of(cleanList);
    this.showSearchCard = false;
    this.showPrescriptionPages = true;
  }

  private cleanAndDeduplicate(list: Prescription[]): Prescription[] {
    const seen = new Set<string>();
    const result: Prescription[] = [];

    for (const p of list) {
      const key = `${p.id || ''}-${p.patientname || ''}-${p.date || ''}-${p.prescription || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        // Ensure doctorname does not display raw email
        if (p.doctorname) {
          p.doctorname = this.formatDoctorName(p.doctorname);
        }
        result.push(p);
      }
    }

    return result;
  }

  formatDoctorName(doctorName: string | undefined): string {
    if (!doctorName) return 'Specialist Doctor';

    const trimmed = doctorName.trim();

    // Check doctor map first
    const mapped = this.doctorMap[trimmed.toLowerCase()];
    if (mapped) {
      return this.ensureDrPrefix(mapped);
    }

    // If it contains an email address, clean it into a professional name
    if (trimmed.includes('@')) {
      const namePart = trimmed.split('@')[0];
      const cleaned = namePart
        .replace(/[._\-\d]+/g, ' ')
        .trim()
        .split(' ')
        .filter(w => w.length > 0)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      return this.ensureDrPrefix(cleaned || 'Specialist');
    }

    return this.ensureDrPrefix(trimmed);
  }

  private ensureDrPrefix(name: string): string {
    if (/^dr\.?/i.test(name)) {
      return name;
    }
    return `Dr. ${name}`;
  }

  canEditPrescription(): boolean {
    return this.currRole === 'doctor' || this.currRole === 'admin';
  }

  startEditPrescription(p: Prescription): void {
    this.editingPrescription = { ...p };
    this.editDoctorName = this.formatDoctorName(p.doctorname);
    this.editDisease = p.disease || '';
    this.editPrescriptionText = p.prescription || '';
    this.editAdmissionStatus = p.admissionstatus || 'false';
    this.updateSuccessMessage = '';
    this.updateErrorMessage = '';
  }

  cancelEditPrescription(): void {
    this.editingPrescription = null;
    this.updateSuccessMessage = '';
    this.updateErrorMessage = '';
  }

  savePrescriptionUpdate(): void {
    if (!this.editingPrescription || this.isUpdating) return;

    this.isUpdating = true;
    this.updateSuccessMessage = '';
    this.updateErrorMessage = '';

    const updated = new Prescription();
    updated.id = this.editingPrescription.id;
    updated.patientid = this.editingPrescription.patientid;
    updated.patientname = this.editingPrescription.patientname;
    updated.doctorname = this.editDoctorName.trim();
    updated.disease = this.editDisease.trim();
    updated.prescription = this.editPrescriptionText.trim();
    updated.admissionstatus = this.editAdmissionStatus;
    updated.gender = this.editingPrescription.gender;
    updated.age = this.editingPrescription.age;
    updated.date = this.editingPrescription.date;

    this._service.updatePrescription(updated).subscribe({
      next: (res) => {
        this.isUpdating = false;
        this.updateSuccessMessage = 'Prescription updated successfully!';

        // Update local array immediately
        const index = this.prescriptionsList.findIndex(p => p.id === updated.id);
        if (index !== -1) {
          this.prescriptionsList[index] = { ...updated };
          this.prescriptionlist = of([...this.prescriptionsList]);
        }

        setTimeout(() => {
          this.editingPrescription = null;
          this.updateSuccessMessage = '';
        }, 1500);
      },
      error: (err) => {
        console.error('Update prescription error', err);
        this.isUpdating = false;
        this.updateErrorMessage = 'Failed to update prescription. Please try again.';
      }
    });
  }

  clearSearch(): void {
    this.name = '';
    this.prescriptionlist = undefined;
    this.prescriptionsList = [];
    this.showSearchCard = true;
    this.showPrescriptionPages = false;
    this.hasSearched = false;
    this.searchError = '';
    this.editingPrescription = null;
  }

  onPrint(): void {
    window.print();
  }

  getPatientImage(gender: string | undefined): string {
    const normalizedGender = (gender || '').toLowerCase().trim();

    if (normalizedGender === 'female') {
      return 'assets/img/femaleuser.png';
    }

    return 'assets/img/maleuser.png';
  }

  getAdmissionStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'accept':
        return 'Admitted';
      case 'false':
        return 'Admission Pending';
      case 'reject':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  getAdmissionStatusClass(status: string | undefined): string {
    switch (status) {
      case 'accept':
        return 'accepted';
      case 'false':
        return 'pending';
      case 'reject':
        return 'rejected';
      default:
        return 'unknown';
    }
  }

  trackByPrescription(index: number, item: Prescription): string {
    return item.id?.toString() || item.patientid?.toString() || index.toString();
  }
}
