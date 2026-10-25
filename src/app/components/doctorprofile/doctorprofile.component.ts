import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Doctor } from 'src/app/models/doctor';
import { DoctorService } from 'src/app/services/doctor.service';

@Component({
  standalone: false,
  selector: 'app-doctorprofile',
  templateUrl: './doctorprofile.component.html',
  styleUrls: ['./doctorprofile.component.css']
})
export class DoctorprofileComponent implements OnInit {
  profileDetails!: Observable<Doctor[]>;
  doctor: Doctor = new Doctor();

  msg: string = '';
  errorMsg: string = '';
  currRole: string = '';
  loggedUser: string = '';
  isEditMode: boolean = false;
  updateSuccess: boolean = false;
  profileVersion: string = 'v2.0.0 Enterprise';

  constructor(
    private _service: DoctorService,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.loggedUser = sessionStorage.getItem('loggedUser') || '';
    this.currRole = sessionStorage.getItem('ROLE') || 'Doctor';

    this.getProfileDetails(this.loggedUser);
  }

  getProfileDetails(email: string): void {
    this.profileDetails = this._service.getProfileDetails(email);

    this.profileDetails.subscribe({
      next: (data: Doctor[]) => {
        if (data && data.length > 0)
        {
          this.doctor = { ...data[0] };
        }
      },
      error: (error) => {
        console.error('Profile Load Failed', error);
        this.errorMsg = 'Unable to load profile details.';
      }
    });
  }

  editProfile(): void {
    this.isEditMode = true;
    this.msg = '';
    this.errorMsg = '';
    this.updateSuccess = false;
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.msg = '';
    this.errorMsg = '';
    this.updateSuccess = false;
    this.getProfileDetails(this.loggedUser);
  }

  updateDoctorProfile(): void {
    this.msg = '';
    this.errorMsg = '';
    this.updateSuccess = false;

    this._service.UpdateDoctorProfile(this.doctor).subscribe({
      next: (data) => {
        this.msg = 'Profile updated successfully.';
        this.updateSuccess = true;
        this.isEditMode = false;

        if (data) {
          this.doctor = { ...data };
        }

        if (this.doctor.doctorname) {
          sessionStorage.setItem('doctorname', this.doctor.doctorname);
          sessionStorage.setItem('name', this.doctor.doctorname);
        }
        if (this.doctor.gender) {
          sessionStorage.setItem('gender', this.doctor.gender);
        }
        if (this.doctor.email) {
          sessionStorage.setItem('loggedUser', this.doctor.email);
        }

        // Instant view update without needing refresh
        this.profileDetails = of([this.doctor]);
        window.dispatchEvent(new Event('storage'));

        this.getProfileDetails(this.loggedUser);

        setTimeout(() => {
          this._router.navigate(['/doctordashboard']);
        }, 2500);
      },
      error: (error) => {
        console.error('Profile Update Failed', error);
        this.errorMsg = 'Profile update failed. Please try again.';
      }
    });
  }

  getProfileImage(gender: string | undefined): string {
    if ((gender || '').toLowerCase() === 'female')
    {
      return 'assets/img/femaledoctor.png';
    }
    return 'assets/img/maledoctor.png';
  }

  getExperienceLabel(exp: any): string {
    if (!exp && exp !== 0) return 'Experienced Specialist';
    const num = Number(exp);
    if (isNaN(num) || num <= 0) return 'Resident Practitioner';
    if (num < 3) return `${num} Year(s) Associate Specialist`;
    if (num < 8) return `${num} Years Senior Consultant`;
    return `${num}+ Years Principal Specialist`;
  }

  getInitials(name?: string): string {
    if (!name) return 'DR';
    const clean = name.trim().replace(/^dr\.?\s*/i, '');
    const parts = clean.split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 0) return 'DR';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
