import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';
import { Doctor } from 'src/app/models/doctor';
import { DoctorService } from 'src/app/services/doctor.service';
import { UserService } from 'src/app/services/user.service';

interface PortalCard {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: string;
  route: string;
  badge: string;
}

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  role: string;
  message: string;
  image: string;
}

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface ProcessStep {
  step: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  standalone: false,
  selector: 'app-welcomepage',
  templateUrl: './welcomepage.component.html',
  styleUrls: ['./welcomepage.component.css']
})
export class WelcomepageComponent implements OnInit {
  isMenuOpen = false;

  doctorsCount$!: Observable<number>;
  patientsCount$!: Observable<number>;
  departmentsCount$!: Observable<number>;
  slotsCount$!: Observable<number>;

  approvedDoctors$!: Observable<Doctor[]>;
  departments$!: Observable<string[]>;

  portals: PortalCard[] = [
    {
      title: 'Admin Portal',
      subtitle: 'Hospital Operations',
      description: 'Manage doctors, departments, appointments, analytics, staff operations and platform administration from one centralized dashboard.',
      image: 'assets/img/admin.png',
      icon: 'fa fa-briefcase',
      route: '/login',
      badge: 'Management'
    },
    {
      title: 'Doctor Portal',
      subtitle: 'Clinical Workspace',
      description: 'Access consultations, prescriptions, treatment records, appointments and patient history with streamlined workflow management.',
      image: 'assets/img/maledoctor.png',
      icon: 'fa fa-user-md',
      route: '/login',
      badge: 'Professional'
    },
    {
      title: 'Patient Portal',
      subtitle: 'Self Service',
      description: 'Book appointments, explore doctors, view reports, track prescriptions and manage healthcare interactions digitally.',
      image: 'assets/img/maleuser.png',
      icon: 'fa fa-user',
      route: '/login',
      badge: 'Digital Access'
    }
  ];

  features: FeatureCard[] = [
    {
      icon: 'fa fa-calendar-check-o',
      title: 'Appointment Scheduling',
      description: 'Smart booking workflow with doctor availability, slot management and consultation planning.'
    },
    {
      icon: 'fa fa-file-text-o',
      title: 'Medical Records',
      description: 'Maintain centralized digital records including diagnosis, prescriptions, reports and history.'
    },
    {
      icon: 'fa fa-stethoscope',
      title: 'Specialist Care',
      description: 'Support multiple departments and specialist consultation management with structured workflows.'
    },
    {
      icon: 'fa fa-credit-card',
      title: 'Billing & Payments',
      description: 'Track invoices, payments, billing activities and financial records in one place.'
    },
    {
      icon: 'fa fa-line-chart',
      title: 'Analytics Dashboard',
      description: 'View hospital performance insights, appointment trends and service utilization metrics.'
    },
    {
      icon: 'fa fa-shield',
      title: 'Role-Based Security',
      description: 'Improve data protection with role access, controlled operations and secure workflows.'
    }
  ];

  processSteps: ProcessStep[] = [
    {
      step: '01',
      title: 'Create Account',
      description: 'Register and access the healthcare platform securely.',
      icon: 'fa fa-user-plus'
    },
    {
      step: '02',
      title: 'Choose Service',
      description: 'Select doctor, department or hospital service as needed.',
      icon: 'fa fa-list-alt'
    },
    {
      step: '03',
      title: 'Book Appointment',
      description: 'Schedule your consultation based on available slots.',
      icon: 'fa fa-calendar'
    },
    {
      step: '04',
      title: 'Get Care',
      description: 'Consult doctors and manage records, reports and follow-ups.',
      icon: 'fa fa-heartbeat'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Aman Verma',
      role: 'Patient',
      message: 'The appointment process is smooth and the portal makes healthcare management very easy and professional.',
      image: 'assets/img/maleuser.png'
    },
    {
      name: 'Dr. Riya Sharma',
      role: 'Senior Physician',
      message: 'This system simplifies patient handling, consultation flow and prescription management efficiently.',
      image: 'assets/img/maledoctor.png'
    },
    {
      name: 'Admin Team',
      role: 'Hospital Operations',
      message: 'A highly organized and scalable hospital management platform for modern healthcare administration.',
      image: 'assets/img/admin.png'
    }
  ];

  faqs: FaqItem[] = [
    {
      question: 'How can patients book appointments?',
      answer: 'Patients can log in to the portal, choose a doctor or department, select a slot and confirm the appointment digitally.',
      isOpen: true
    },
    {
      question: 'Can doctors manage prescriptions and reports?',
      answer: 'Yes, doctors can manage appointments, update patient records, generate prescriptions and review medical reports from their dashboard.',
      isOpen: false
    },
    {
      question: 'Is this platform suitable for hospitals and clinics?',
      answer: 'Yes, the architecture is suitable for hospitals, clinics and healthcare institutions that need scalable operational management.',
      isOpen: false
    },
    {
      question: 'Does the system support secure role-based access?',
      answer: 'Yes, the system is designed to support secure role-based access for admin, doctor and patient workflows.',
      isOpen: false
    }
  ];

  constructor(
    private router: Router,
    private userService: UserService,
    private doctorService: DoctorService
  ) { }

  ngOnInit(): void {
    this.initializeDynamicData();
  }

  private initializeDynamicData(): void {
    this.doctorsCount$ = this.toCount(this.userService.getTotalDoctors());
    this.patientsCount$ = this.toCount(this.userService.getTotalPatients());
    this.slotsCount$ = this.toCount(this.userService.getTotalSlots());

    this.departments$ = this.doctorService.getSlotListWithUniqueSpecializations().pipe(
      map(deps => {
        if (!deps || deps.length === 0) {
          return ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'];
        }
        return Array.from(new Set(deps.filter(Boolean).map(d => d.trim())));
      }),
      startWith(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics']),
      catchError(() => of(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'])),
      shareReplay(1)
    );

    this.departmentsCount$ = this.departments$.pipe(
      map(deps => Math.max(deps.length, 4)),
      startWith(4),
      shareReplay(1)
    );

    this.approvedDoctors$ = this.doctorService.getDoctorList().pipe(
      map(doctors => (doctors || []).filter(doc => doc.status?.toLowerCase() === 'accept')),
      startWith([]),
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  private toCount(source$: Observable<any>): Observable<number> {
    return source$.pipe(
      map((response: any) => {
        if (typeof response === 'number') return response;
        if (Array.isArray(response)) {
          if (response.length === 1 && typeof response[0] === 'number') {
            return response[0];
          }
          return response.length;
        }
        return Number(response) || 0;
      }),
      startWith(0),
      catchError(() => of(0)),
      shareReplay(1)
    );
  }

  getDoctorImage(gender?: string): string {
    return gender?.toLowerCase() === 'female'
      ? 'assets/img/femaledoctor.png'
      : 'assets/img/maledoctor.png';
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isMenuOpen = false;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element)
    {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    this.isMenuOpen = false;
  }

  toggleFaq(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }
}
