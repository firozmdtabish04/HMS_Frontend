import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Doctor } from 'src/app/models/doctor';
import { User } from 'src/app/models/user';
import { DoctorService } from 'src/app/services/doctor.service';
import { RegistrationService } from 'src/app/services/registration.service';
import { LoginService } from 'src/app/services/login.service';

@Component({
  standalone: false,
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {
  user = new User();
  doctor = new Doctor();
  msg: string = '';
  otpStatusMsg: string = '';

  activeTab: 'user' | 'doctor' = 'user';

  userConfirmPassword: string = '';
  doctorConfirmPassword: string = '';

  showUserPassword: boolean = false;
  showUserConfirmPassword: boolean = false;
  showDoctorPassword: boolean = false;
  showDoctorConfirmPassword: boolean = false;

  userAcceptedTerms: boolean = false;
  doctorAcceptedTerms: boolean = false;

  isUserSubmitting: boolean = false;
  isDoctorSubmitting: boolean = false;

  // OTP Verification for Registration
  isVerifyingOtp: boolean = false;
  otpSent: boolean = false;
  demoOtpCode: string = '';
  enteredOtp: string = '';
  isOtpVerified: boolean = false;

  constructor(
    private _registrationService: RegistrationService,
    private _doctorService: DoctorService,
    private _loginService: LoginService,
    private _router: Router
  ) { }

  ngOnInit(): void { }

  setTab(tab: 'user' | 'doctor'): void {
    this.activeTab = tab;
    this.msg = '';
    this.otpStatusMsg = '';
  }

  toggleUserPassword(): void {
    this.showUserPassword = !this.showUserPassword;
  }

  toggleUserConfirmPassword(): void {
    this.showUserConfirmPassword = !this.showUserConfirmPassword;
  }

  toggleDoctorPassword(): void {
    this.showDoctorPassword = !this.showDoctorPassword;
  }

  toggleDoctorConfirmPassword(): void {
    this.showDoctorConfirmPassword = !this.showDoctorConfirmPassword;
  }

  isUserPasswordMismatch(): boolean {
    return !!this.userConfirmPassword && this.user.password !== this.userConfirmPassword;
  }

  isDoctorPasswordMismatch(): boolean {
    return !!this.doctorConfirmPassword && this.doctor.password !== this.doctorConfirmPassword;
  }

  sendVerificationOtp(): void {
    const rawTarget = this.activeTab === 'doctor'
      ? (this.doctor.mobile || this.doctor.email)
      : (this.user.mobile || this.user.email);
    const target = String(rawTarget || '').trim();
    if (!target) {
      this.otpStatusMsg = 'Please enter your Gmail address or mobile number first.';
      return;
    }

    this.isVerifyingOtp = true;
    this.otpStatusMsg = '';

    this._loginService.sendOtp(target, this.activeTab).subscribe({
      next: (res: any) => {
        this.isVerifyingOtp = false;
        this.otpSent = true;
        this.otpStatusMsg = '6-Digit code dispatched to ' + target;
        if (res?.otp) {
          this.demoOtpCode = res.otp;
          this.enteredOtp = res.otp; // Auto-fill for convenience
        }
      },
      error: () => {
        this.isVerifyingOtp = false;
        this.otpStatusMsg = 'Failed to dispatch OTP. Please check your credentials.';
      }
    });
  }

  verifyRegistrationOtp(): void {
    const rawTarget = this.activeTab === 'doctor'
      ? (this.doctor.mobile || this.doctor.email)
      : (this.user.mobile || this.user.email);
    const target = String(rawTarget || '').trim();
    if (!target || !this.enteredOtp) {
      this.otpStatusMsg = 'Please enter the 6-digit code.';
      return;
    }

    this.isVerifyingOtp = true;
    this._loginService.verifyOtp(target, this.enteredOtp, this.activeTab).subscribe({
      next: () => {
        this.isVerifyingOtp = false;
        this.isOtpVerified = true;
        this.otpStatusMsg = 'Verification successful! You can now complete registration.';
      },
      error: (err: any) => {
        this.isVerifyingOtp = false;
        this.otpStatusMsg = err?.error?.message || 'Invalid OTP code.';
      }
    });
  }

  registerWithGoogle(): void {
    const sampleEmail = 'user.google@gmail.com';
    const sampleName = 'Google Patient';

    this._loginService.googleOAuthLogin({
      email: sampleEmail,
      name: sampleName,
      googleId: 'g_' + Math.random().toString(36).substring(2, 9)
    }).subscribe({
      next: (res: any) => {
        sessionStorage.clear();
        sessionStorage.setItem('loggedUser', sampleEmail);
        sessionStorage.setItem('USER', 'user');
        sessionStorage.setItem('ROLE', 'user');
        sessionStorage.setItem('username', sampleName);
        sessionStorage.setItem('name', sampleName);
        if (res?.token) {
          sessionStorage.setItem('TOKEN', res.token.startsWith('Bearer ') ? res.token : `Bearer ${res.token}`);
        }
        this._router.navigate(['/registrationsuccess']);
      },
      error: (err: any) => {
        this.msg = err?.error?.message || 'Google registration failed. Please use standard form.';
      }
    });
  }

  registerUser(): void {
    this.msg = '';

    if (this.isUserPasswordMismatch()) {
      this.msg = 'User password and confirm password do not match.';
      return;
    }

    if (!this.userAcceptedTerms) {
      this.msg = 'Please accept Terms & Conditions.';
      return;
    }

    this.isUserSubmitting = true;

    this._registrationService.registerUserFromRemote(this.user).subscribe({
      next: (data: any) => {
        console.log('User Registration Success');
        sessionStorage.setItem('username', this.user.username);
        sessionStorage.setItem('gender', this.user.gender);
        sessionStorage.setItem('loggedUser', this.user.email);
        sessionStorage.setItem('USER', 'user');
        sessionStorage.setItem('ROLE', 'user');

        // Automatically retrieve token
        this._loginService.loginUserFromRemote(this.user).subscribe({
          next: (loginData: any) => {
            if (loginData?.token) {
              sessionStorage.setItem('TOKEN', `Bearer ${loginData.token}`);
            }
            this.isUserSubmitting = false;
            this._router.navigate(['/registrationsuccess']);
          },
          error: () => {
            this.isUserSubmitting = false;
            this._router.navigate(['/registrationsuccess']);
          }
        });
      },
      error: (error: any) => {
        console.error('User Registration Failed', error);
        this.isUserSubmitting = false;
        this.msg = 'User with ' + this.user.email + ' already exists!';
      }
    });
  }

  registerDoctor(): void {
    this.msg = '';

    if (this.isDoctorPasswordMismatch()) {
      this.msg = 'Doctor password and confirm password do not match.';
      return;
    }

    if (!this.doctorAcceptedTerms) {
      this.msg = 'Please accept Terms & Conditions.';
      return;
    }

    this.isDoctorSubmitting = true;

    this._registrationService.registerDoctorFromRemote(this.doctor).subscribe({
      next: (data: any) => {
        console.log('Doctor Registration Success');
        sessionStorage.setItem('doctorname', this.doctor.doctorname);
        sessionStorage.setItem('gender', this.doctor.gender);
        sessionStorage.setItem('loggedUser', this.doctor.email);
        sessionStorage.setItem('USER', 'doctor');
        sessionStorage.setItem('ROLE', 'doctor');
        this.isDoctorSubmitting = false;
        this._router.navigate(['/registrationsuccess']);
      },
      error: (error: any) => {
        console.error('Doctor Registration Failed', error);
        this.isDoctorSubmitting = false;
        this.msg = 'Doctor with ' + this.doctor.email + ' already exists!';
      }
    });
  }
}
