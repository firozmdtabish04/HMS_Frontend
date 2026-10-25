import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NgForm } from '@angular/forms';
import { Appointment } from 'src/app/models/appointment';
import { Slots } from 'src/app/models/slots';
import { DoctorService } from 'src/app/services/doctor.service';
import { UserService } from 'src/app/services/user.service';


@Component({
  standalone: false,
  selector: 'app-bookappointment',
  templateUrl: './bookappointment.component.html',
  styleUrls: ['./bookappointment.component.css']
})
export class BookappointmentComponent implements OnInit {
  currRole = '';
  loggedUser = '';
  message = '';

  appointment = new Appointment();

  slots!: Observable<Slots[]>;
  doctors!: Observable<string[]>;
  specializations!: Observable<string[]>;

  minDate = '';
  isSubmitting = false;
  isBookingFailed = true;
  showMessageCard = false;

  constructor(
    private _service: DoctorService,
    private _router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loggedUser = sessionStorage.getItem('loggedUser') || '';
    this.currRole = sessionStorage.getItem('ROLE') || '';

    this.doctors = this._service.getSlotListWithUniqueDoctors();
    this.specializations = this._service.getSlotListWithUniqueSpecializations();
    this.slots = this._service.getSlotList();

    if (this.loggedUser) {
      this.appointment.email = this.loggedUser;
    }
    const storedUsername = sessionStorage.getItem('username') || sessionStorage.getItem('name');
    if (storedUsername) {
      this.appointment.patientname = storedUsername;
    }

    this.route.queryParams.subscribe(params => {
      if (params['doctor']) {
        this.appointment.doctorname = params['doctor'];
      }
      if (params['specialization']) {
        this.appointment.specialization = params['specialization'];
      }
      if (params['speciality']) {
        this.appointment.specialization = params['speciality'];
      }
    });

    this.minDate = this.getTodayDate();

    this.showMessageCard = false;
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  resetForm(form: NgForm): void {
    form.resetForm({
      patientname: '',
      email: '',
      doctorname: '',
      specialization: '',
      date: '',
      slot: 'AM slot',
      age: '',
      gender: 'Male',
      problem: ''
    });
  }

  showFormAgain(): void {
    this.showMessageCard = false;


  }

  bookAppointment(): void {
    this.isSubmitting = true;

    this.userService.addBookingAppointments(this.appointment).subscribe(
      data => {
        console.log('appointment booked Successfully');
        this.isSubmitting = false;
        this._router.navigate(['/userdashboard']);
      },
      error => {
        console.log('process Failed');
        this.isSubmitting = false;
        this.isBookingFailed = true;
        this.showMessageCard = true;


        this.message =
          'There is a problem in booking your appointment. Please check slot availability and try again.';
        console.log(error.error);
      }
    );
  }
}