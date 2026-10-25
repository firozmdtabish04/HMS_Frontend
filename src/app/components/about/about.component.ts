import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';
import { Doctor } from 'src/app/models/doctor';
import { DoctorService } from 'src/app/services/doctor.service';
import { UserService } from 'src/app/services/user.service';

interface ValueItem {
  title: string;
  description: string;
  icon: string;
}

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

interface LeadershipItem {
  name: string;
  role: string;
  image: string;
}

interface QualityItem {
  title: string;
  status: string;
  icon: string;
}

@Component({
  standalone: false,
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent implements OnInit {
  hospitalName = 'Healthcare Management Hospital';
  establishedYear = 2023;

  heroBadge = 'Trusted Multi-Speciality Healthcare';
  location = 'Bhubaneswar, Odisha';
  supportAvailability = '24/7 Emergency & Patient Support';

  doctorsCount$!: Observable<number>;
  patientsCount$!: Observable<number>;
  departmentsCount$!: Observable<number>;
  slotsCount$!: Observable<number>;

  activeDoctors$!: Observable<Doctor[]>;

  get yearsOfService(): number {
    return new Date().getFullYear() - this.establishedYear;
  }

  coreValues: ValueItem[] = [
    {
      title: 'Compassion',
      description:
        'We treat every patient with empathy, dignity, and human-centered care.',
      icon: 'fa fa-heart',
    },
    {
      title: 'Integrity',
      description:
        'We follow ethical medical practices with honesty and accountability.',
      icon: 'fa fa-shield',
    },
    {
      title: 'Excellence',
      description:
        'We strive for the highest standards in treatment, safety, and service.',
      icon: 'fa fa-star',
    },
    {
      title: 'Innovation',
      description:
        'We adopt modern healthcare systems and technology for better outcomes.',
      icon: 'fa fa-lightbulb-o',
    },
  ];

  qualityIndicators: QualityItem[] = [
    {
      title: 'Patient Safety Protocols',
      status: 'Strong',
      icon: 'fa fa-check-circle',
    },
    {
      title: 'Emergency Readiness',
      status: '24/7 Active',
      icon: 'fa fa-ambulance',
    },
    {
      title: 'Digital Healthcare Workflow',
      status: 'Enabled',
      icon: 'fa fa-laptop',
    },
    {
      title: 'Care Coordination',
      status: 'Integrated',
      icon: 'fa fa-sitemap',
    },
  ];

  timeline: TimelineItem[] = [
    {
      year: '2002',
      title: 'Hospital Founded',
      description:
        'Started with a mission to provide dependable and compassionate healthcare.',
    },
    {
      year: '2009',
      title: 'Expanded Specialist Services',
      description:
        'Introduced advanced departments for heart care, orthopedics, and diagnostics.',
    },
    {
      year: '2016',
      title: 'Technology Modernization',
      description:
        'Adopted digital patient workflows, reporting systems, and service coordination.',
    },
    {
      year: '2023',
      title: 'Enterprise Care Experience',
      description:
        'Strengthened patient support, appointment systems, and integrated care operations.',
    },
  ];

  leadershipTeam: LeadershipItem[] = [
    {
      name: 'Tabish Firoz',
      role: 'Managing Director & Hospital Lead',
      image: 'assets/img/admin.png',
    },
    {
      name: 'Dr. Abhilipsa Pati',
      role: 'Head of Neurology & Clinical Ops',
      image: 'assets/img/femaledoctor.png',
    },
    {
      name: 'Dr. Roshan Kumar Patra',
      role: 'Chief Medical Consultant',
      image: 'assets/img/maledoctor.png',
    },
  ];

  mission =
    'To provide compassionate, high-quality healthcare and improve lives through innovation, education, safety, and empathy.';

  vision =
    'To be a trusted healthcare institution recognized for clinical excellence, patient-first service, and modern healthcare delivery.';

  constructor(
    private userService: UserService,
    private doctorService: DoctorService,
  ) {}

  ngOnInit(): void {
    this.doctorsCount$ = this.toCount(this.userService.getTotalDoctors());
    this.patientsCount$ = this.toCount(this.userService.getTotalPatients());
    this.slotsCount$ = this.toCount(this.userService.getTotalSlots());

    this.departmentsCount$ = this.doctorService
      .getSlotListWithUniqueSpecializations()
      .pipe(
        map((deps) => (deps && deps.length > 0 ? deps.length : 8)),
        startWith(8),
        catchError(() => of(8)),
        shareReplay(1),
      );

    this.activeDoctors$ = this.doctorService.getDoctorList().pipe(
      map((docs) =>
        (docs || []).filter((d) => d.status?.toLowerCase() === 'accept'),
      ),
      startWith([]),
      catchError(() => of([])),
      shareReplay(1),
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
      shareReplay(1),
    );
  }

  getDoctorImg(gender?: string): string {
    return gender?.toLowerCase() === 'female'
      ? 'assets/img/femaledoctor.png'
      : 'assets/img/maledoctor.png';
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
