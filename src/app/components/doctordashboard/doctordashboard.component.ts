import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DoctorService } from 'src/app/services/doctor.service';
import { UserService } from 'src/app/services/user.service';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
}

interface ScheduleItem {
  time: string;
  title: string;
  patient: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
}

interface ActivityItem {
  icon: string;
  title: string;
  subtitle: string;
  time: string;
}

interface AppointmentItem {
  patientName: string;
  department: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
}

@Component({
  standalone: false,
  selector: 'app-doctordashboard',
  templateUrl: './doctordashboard.component.html',
  styleUrls: ['./doctordashboard.component.css']
})
export class DoctordashboardComponent implements OnInit {
  name = '';
  gender = '';
  loggedUser = '';
  currRole = '';

  isSidebarOpen = true;
  currentDate: Date = new Date();
  dashboardVersion = 'v2.0.0 Enterprise';
  appName = 'HealthCare Management System';

  patients$: Observable<any[]> | undefined;
  users$: Observable<any[]> | undefined;
  doctors$: Observable<any[]> | undefined;
  slots$: Observable<any[]> | undefined;
  prescriptions$: Observable<any[]> | undefined;

  totalPatients = 0;
  totalDoctors = 0;
  totalSlots = 0;
  totalPrescriptions = 0;
  totalUsers = 0;

  completionRate = 95;
  patientSatisfaction = 98;
  monthlyAppointments = 0;
  activeCases = 0;
  availableSlotsToday = 0;
  pendingApprovals = 0;

  quickActions: QuickAction[] = [
    {
      title: 'Edit Profile',
      description: 'Update your doctor profile and account details',
      icon: 'fa-edit',
      route: '/editdoctorprofile'
    },
    {
      title: 'Approval Status',
      description: 'Review onboarding and verification progress',
      icon: 'fa-check-circle',
      route: '/approvalstatus'
    },
    {
      title: 'Manage Schedule',
      description: 'Configure slots and availability timings',
      icon: 'fa-clock-o',
      route: '/scheduleslots'
    },
    {
      title: 'Doctor Directory',
      description: 'Browse all registered doctors',
      icon: 'fa-user-md',
      route: '/doctorlist'
    },
    {
      title: 'Patient Records',
      description: 'Access and manage patient details',
      icon: 'fa-users',
      route: '/patientlist'
    },
    {
      title: 'Add Prescription',
      description: 'Create and assign prescriptions quickly',
      icon: 'fa-sticky-note-o',
      route: '/addprescription'
    }
  ];

  todaySchedule: ScheduleItem[] = [];
  recentActivities: ActivityItem[] = [];
  recentAppointments: AppointmentItem[] = [];

  constructor(
    private _service: UserService,
    private doctorService: DoctorService,
    private _route: Router
  ) { }

  ngOnInit(): void {
    const storedDoctorName = sessionStorage.getItem('doctorname');
    const storedName = sessionStorage.getItem('name');
    this.loggedUser = sessionStorage.getItem('loggedUser') || '';
    const rawName = storedDoctorName || storedName || this.loggedUser || 'Doctor';
    if (rawName && rawName.includes('@')) {
      const clean = rawName.split('@')[0].replace(/[._-]+/g, ' ').trim();
      this.name = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    } else {
      this.name = rawName;
    }
    this.gender = sessionStorage.getItem('gender') || '';
    this.currRole = sessionStorage.getItem('ROLE') || 'Doctor';

    this.loadDashboardStats();
    this.loadDoctorSpecificData();
  }

  refreshDoctorData(): void {
    this.loadDashboardStats();
    this.loadDoctorSpecificData();
  }

  loadDashboardStats(): void {
    this.patients$ = this._service.getTotalPatients();
    this.users$ = this._service.getTotalUsers();
    this.doctors$ = this._service.getTotalDoctors();
    this.slots$ = this._service.getTotalSlots();
    this.prescriptions$ = this._service.getTotalPrescriptions();

    this.patients$?.subscribe({
      next: (data: any[]) => this.totalPatients = this.extractCount(data),
      error: () => this.totalPatients = 0
    });

    this.users$?.subscribe({
      next: (data: any[]) => this.totalUsers = this.extractCount(data),
      error: () => this.totalUsers = 0
    });

    this.doctors$?.subscribe({
      next: (data: any[]) => this.totalDoctors = this.extractCount(data),
      error: () => this.totalDoctors = 0
    });

    this.slots$?.subscribe({
      next: (data: any[]) => this.totalSlots = this.extractCount(data),
      error: () => this.totalSlots = 0
    });

    this.prescriptions$?.subscribe({
      next: (data: any[]) => this.totalPrescriptions = this.extractCount(data),
      error: () => this.totalPrescriptions = 0
    });
  }

  loadDoctorSpecificData(): void {
    if (!this.loggedUser) return;

    // Load Doctor's Real Patients
    this.doctorService.getPatientListByDoctorEmail(this.loggedUser).subscribe({
      next: (patients: any[]) => {
        if (patients && Array.isArray(patients) && patients.length > 0) {
          this.monthlyAppointments = patients.length;
          this.activeCases = patients.filter(p => p.admissionstatus === 'accept').length;
          this.pendingApprovals = patients.filter(p => p.appointmentstatus === 'false').length;

          // Populate real appointments
          this.recentAppointments = patients.slice(0, 5).map(p => ({
            patientName: p.patientname || 'Patient',
            department: p.specialization || 'Clinical Care',
            date: p.date || 'Scheduled',
            time: p.slot || 'General Slot',
            status: p.appointmentstatus === 'accept' ? 'Confirmed' : (p.appointmentstatus === 'reject' ? 'Completed' : 'Pending')
          }));

          // Populate real schedule
          this.todaySchedule = patients.slice(0, 4).map(p => ({
            time: p.slot || 'Scheduled Slot',
            title: p.problem || 'Clinical Consultation',
            patient: p.patientname || 'Patient',
            status: p.appointmentstatus === 'accept' ? 'Confirmed' : 'Pending'
          }));

          // Populate real activity
          this.recentActivities = patients.slice(0, 4).map(p => ({
            icon: 'fa-calendar-check-o',
            title: `Appointment request: ${p.patientname}`,
            subtitle: `Symptom: ${p.problem || 'General Checkup'} • Date: ${p.date}`,
            time: p.date || 'Recent'
          }));
        } else {
          this.setDefaultDoctorData();
        }
      },
      error: () => {
        this.setDefaultDoctorData();
      }
    });

    // Load Doctor's Real Slots
    this.doctorService.getSlotDetails(this.loggedUser).subscribe({
      next: (slots: any[]) => {
        if (slots && Array.isArray(slots)) {
          this.availableSlotsToday = slots.length;
        }
      },
      error: () => {
        this.availableSlotsToday = 0;
      }
    });
  }

  private setDefaultDoctorData(): void {
    this.monthlyAppointments = 0;
    this.activeCases = 0;
    this.pendingApprovals = 0;

    this.todaySchedule = [
      {
        time: '09:00 AM',
        title: 'Morning Consultation',
        patient: 'Waiting for bookings',
        status: 'Pending'
      }
    ];

    this.recentActivities = [
      {
        icon: 'fa-user-md',
        title: 'Doctor Portal Initialized',
        subtitle: 'Your clinical workspace is ready to receive appointments',
        time: 'Just now'
      }
    ];

    this.recentAppointments = [];
  }

  extractCount(data: any): number {
    if (Array.isArray(data) && data.length > 0)
    {
      if (typeof data[0] === 'number')
      {
        return data[0];
      }

      if (typeof data[0] === 'string')
      {
        return +data[0] || 0;
      }

      if (typeof data[0] === 'object' && data[0] !== null)
      {
        const firstKey = Object.keys(data[0])[0];
        return +data[0][firstKey] || 0;
      }
    }

    if (typeof data === 'number')
    {
      return data;
    }

    return 0;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  navigateTo(route: string): void {
    this._route.navigate([route]);
  }

  getProfileImage(): string {
    if (this.gender?.toLowerCase() === 'female')
    {
      return 'assets/img/femaledoctor.png';
    }
    return 'assets/img/maledoctor.png';
  }

  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12)
    {
      return 'Good Morning';
    } else if (hour < 17)
    {
      return 'Good Afternoon';
    } else
    {
      return 'Good Evening';
    }
  }

  getShortName(): string {
    if (!this.name)
    {
      return 'DR';
    }

    return this.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
}
