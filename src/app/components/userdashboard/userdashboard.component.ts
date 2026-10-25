import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { Appointment } from 'src/app/models/appointment';
import { DoctorService } from 'src/app/services/doctor.service';
import { UserService } from 'src/app/services/user.service';

interface DashboardStat {
  title: string;
  value$?: Observable<number>;
  icon: string;
  route: string;
  theme:
    | 'blue'
    | 'orange'
    | 'red'
    | 'green'
    | 'purple'
    | 'teal'
    | 'dark';
  subtitle: string;
}

@Component({
  standalone: false,
  selector: 'app-userdashboard',
  templateUrl: './userdashboard.component.html',
  styleUrls: ['./userdashboard.component.css']
})
export class UserdashboardComponent implements OnInit {
  name = '';
  gender = '';
  currRole = '';
  loggedUser = '';
  isCollapsed = false;

  totalPatients$!: Observable<number>;
  totalUsers$!: Observable<number>;
  totalDoctors$!: Observable<number>;
  totalSlots$!: Observable<number>;

  myAppointments$!: Observable<Appointment[]>;
  myAppointmentsCount = 0;
  myAcceptedCount = 0;
  myPendingCount = 0;

  stats: DashboardStat[] = [];

  quickLinks = [
    {
      label: 'Edit Profile',
      icon: 'fa fa-edit',
      route: '/edituserprofile'
    },
    {
      label: 'Doctor List',
      icon: 'fa fa-user-md',
      route: '/doctorlist'
    },
    {
      label: 'Check Slots',
      icon: 'fa fa-clock-o',
      route: '/checkslots'
    },
    {
      label: 'New Appointment',
      icon: 'fa fa-calendar',
      route: '/bookappointment'
    },
    {
      label: 'Approval Status',
      icon: 'fa fa-check',
      route: '/approvalstatus'
    },
    {
      label: 'Prescription',
      icon: 'fa fa-sticky-note-o',
      route: '/prescriptionlist'
    }
  ];

  constructor(
    private userService: UserService,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    const storedUsername = sessionStorage.getItem('username');
    const storedName = sessionStorage.getItem('name');
    this.loggedUser = sessionStorage.getItem('loggedUser') || '';
    const rawName = storedUsername || storedName || this.loggedUser || 'User';
    if (rawName && rawName.includes('@')) {
      const clean = rawName.split('@')[0].replace(/[._-]+/g, ' ').trim();
      this.name = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    } else {
      this.name = rawName;
    }
    this.gender = sessionStorage.getItem('gender') || '';
    this.currRole = sessionStorage.getItem('ROLE') || 'User';

    this.totalPatients$ = this.userService
      .getTotalPatients()
      .pipe(map((res: any[]) => this.extractCount(res)), shareReplay(1));

    this.totalUsers$ = this.userService
      .getTotalUsers()
      .pipe(map((res: any[]) => this.extractCount(res)), shareReplay(1));

    this.totalDoctors$ = this.userService
      .getTotalDoctors()
      .pipe(map((res: any[]) => this.extractCount(res)), shareReplay(1));

    this.totalSlots$ = this.userService
      .getTotalSlots()
      .pipe(map((res: any[]) => this.extractCount(res)), shareReplay(1));

    this.stats = [
      {
        title: 'Total Doctors',
        value$: this.totalDoctors$,
        icon: 'fa fa-user-md',
        route: '/doctorlist',
        theme: 'blue',
        subtitle: 'Available specialists in the system'
      },
      {
        title: 'Total Users',
        value$: this.totalUsers$,
        icon: 'fa fa-users',
        route: '/userlist',
        theme: 'orange',
        subtitle: 'Registered users across the platform'
      },
      {
        title: 'Total Patients',
        value$: this.totalPatients$,
        icon: 'fa fa-user',
        route: '/patientlist',
        theme: 'red',
        subtitle: 'Patients currently managed'
      },
      {
        title: 'Available Slots',
        value$: this.totalSlots$,
        icon: 'fa fa-calendar',
        route: '/checkslots',
        theme: 'green',
        subtitle: 'Bookable appointment slots'
      },
      {
        title: 'Book Appointments',
        icon: 'fa fa-calendar-check-o',
        route: '/bookappointment',
        theme: 'purple',
        subtitle: 'Schedule and manage appointments'
      },
      {
        title: 'Prescriptions',
        icon: 'fa fa-sticky-note',
        route: '/prescriptionlist',
        theme: 'teal',
        subtitle: 'Access issued prescriptions'
      },
      {
        title: 'Hospital Services',
        icon: 'fa fa-hospital-o',
        route: '/services',
        theme: 'dark',
        subtitle: 'Explore healthcare services'
      }
    ];

    this.loadUserAppointments();
  }

  refreshUserData(): void {
    this.loadUserAppointments();
  }

  loadUserAppointments(): void {
    if (!this.loggedUser) return;

    this.myAppointments$ = this.doctorService.getPatientListByEmail(this.loggedUser).pipe(
      catchError(() => of([])),
      shareReplay(1)
    );

    this.myAppointments$.subscribe({
      next: (apps) => {
        if (apps && Array.isArray(apps)) {
          this.myAppointmentsCount = apps.length;
          this.myAcceptedCount = apps.filter(a => a.appointmentstatus === 'accept').length;
          this.myPendingCount = apps.filter(a => a.appointmentstatus === 'false').length;
        }
      },
      error: () => {
        this.myAppointmentsCount = 0;
      }
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'accept': return 'status-accepted';
      case 'reject': return 'status-rejected';
      case 'false':
      default: return 'status-pending';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'accept': return 'Confirmed';
      case 'reject': return 'Cancelled';
      case 'false':
      default: return 'Pending Approval';
    }
  }

  private extractCount(data: any): number {
    if (Array.isArray(data)) {
      if (data.length === 1 && typeof data[0] === 'number') {
        return data[0];
      }
      return data.length;
    }

    if (typeof data === 'number') {
      return data;
    }

    return 0;
  }
}
