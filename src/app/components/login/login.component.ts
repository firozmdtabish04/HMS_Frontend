import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Doctor } from 'src/app/models/doctor';
import { User } from 'src/app/models/user';
import { LoginService } from 'src/app/services/login.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  // Mode switcher: 'password' or 'otp'
  authMode: 'password' | 'otp' = 'password';

  // Standard Login Fields
  email: string = '';
  password: string = '';
  msg: string = '';
  loading: boolean = false;
  showPassword: boolean = false;
  rememberMe: boolean = false;

  // OTP Login Fields
  otpIdentifier: string = '';
  otpRole: 'user' | 'doctor' = 'user';
  enteredOtp: string = '';
  otpSent: boolean = false;
  otpLoading: boolean = false;
  otpMsg: string = '';
  otpCooldown: number = 0;
  private cooldownTimer: any;
  demoOtpCode: string = '';

  // Google OAuth Modal / State
  googlePromptOpen: boolean = false;
  googleEmailInput: string = '';
  googleNameInput: string = '';
  isGoogleLoading: boolean = false;

  constructor(
    private _service: LoginService,
    private _router: Router
  ) { }

  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.email = rememberedEmail;
      this.rememberMe = true;
    }
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  }

  switchAuthMode(mode: 'password' | 'otp'): void {
    this.authMode = mode;
    this.msg = '';
    this.otpMsg = '';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // ================= PASSWORD LOGIN =================
  smartLogin(): void {
    this.msg = '';

    if (!this.email || !this.password) {
      this.msg = 'Please enter email and password.';
      return;
    }

    this.loading = true;

    // Check for hardcoded Admin first
    if (this.email.trim() === 'mdtabishfiroz04@gmail.com' && this.password === 'Akhil@04') {
      this.loginAdminDirect();
      return;
    }

    const user = new User();
    user.email = this.email.trim();
    user.password = this.password;

    this._service.loginUserFromRemote(user).subscribe({
      next: (data: any) => {
        console.log('User login success', data);
        sessionStorage.clear();

        const userName =
          data?.username ||
          data?.name ||
          data?.fullName ||
          this.getNameFromEmail(this.email);

        sessionStorage.setItem('loggedUser', this.email);
        sessionStorage.setItem('USER', 'user');
        sessionStorage.setItem('ROLE', 'user');
        sessionStorage.setItem('username', userName);
        sessionStorage.setItem('name', userName);
        sessionStorage.setItem('gender', data?.gender || 'male');

        if (data?.token) {
          sessionStorage.setItem('TOKEN', data.token.startsWith('Bearer ') ? data.token : `Bearer ${data.token}`);
        }

        this.handleRememberMe();
        this.loading = false;
        this._router.navigate(['/userdashboard']);
      },
      error: () => {
        this.tryDoctorLogin();
      }
    });
  }

  tryDoctorLogin(): void {
    const doctor = new Doctor();
    doctor.email = this.email.trim();
    doctor.password = this.password;

    this._service.loginDoctorFromRemote(doctor).subscribe({
      next: (data: any) => {
        console.log('Doctor login success', data);
        sessionStorage.clear();

        const doctorName =
          data?.doctorname ||
          data?.name ||
          data?.fullName ||
          this.getNameFromEmail(this.email);

        sessionStorage.setItem('loggedUser', this.email);
        sessionStorage.setItem('USER', 'doctor');
        sessionStorage.setItem('ROLE', 'doctor');
        sessionStorage.setItem('doctorname', doctorName);
        sessionStorage.setItem('name', doctorName);
        sessionStorage.setItem('gender', data?.gender || 'male');

        if (data?.token) {
          sessionStorage.setItem('TOKEN', data.token.startsWith('Bearer ') ? data.token : `Bearer ${data.token}`);
        }

        this.handleRememberMe();
        this.loading = false;
        this._router.navigate(['/doctordashboard']);
      },
      error: () => {
        this.tryAdminLogin();
      }
    });
  }

  tryAdminLogin(): void {
    const isAdmin = this._service.adminLoginFromRemote(this.email.trim(), this.password);

    if (isAdmin) {
      sessionStorage.clear();
      sessionStorage.setItem('loggedUser', this.email.trim());
      sessionStorage.setItem('USER', 'admin');
      sessionStorage.setItem('ROLE', 'admin');
      sessionStorage.setItem('name', 'Admin');
      sessionStorage.setItem('username', 'Admin');
      sessionStorage.setItem('gender', 'male');

      this.handleRememberMe();
      this.loading = false;
      this._router.navigate(['/admindashboard']);
    } else {
      this.loading = false;
      this.msg = 'Invalid credentials. Please enter correct email and password.';
    }
  }

  private loginAdminDirect(): void {
    this._service.adminLoginRemoteApi(this.email.trim(), this.password).subscribe({
      next: (res) => {
        sessionStorage.clear();
        sessionStorage.setItem('loggedUser', this.email.trim());
        sessionStorage.setItem('USER', 'admin');
        sessionStorage.setItem('ROLE', 'admin');
        sessionStorage.setItem('name', 'Admin');
        sessionStorage.setItem('username', 'Admin');
        sessionStorage.setItem('gender', 'male');
        if (res?.token) {
          sessionStorage.setItem('TOKEN', `Bearer ${res.token}`);
        }
        this.handleRememberMe();
        this.loading = false;
        this._router.navigate(['/admindashboard']);
      },
      error: () => {
        this.tryAdminLogin();
      }
    });
  }

  // ================= OTP LOGIN =================
  requestOtp(): void {
    const target = this.otpIdentifier?.trim();
    if (!target) {
      this.otpMsg = 'Please enter your Gmail address or mobile number.';
      return;
    }

    this.otpLoading = true;
    this.otpMsg = '';

    this._service.sendOtp(target, this.otpRole).subscribe({
      next: (res: any) => {
        this.otpLoading = false;
        this.otpSent = true;
        this.otpMsg = res.message || 'OTP sent successfully.';
        if (res.otp) {
          this.demoOtpCode = res.otp;
        }
        this.startOtpCooldown();
      },
      error: (err: any) => {
        this.otpLoading = false;
        this.otpMsg = err?.error?.message || 'Failed to send OTP. Please try again.';
      }
    });
  }

  verifyOtpAndLogin(): void {
    const target = this.otpIdentifier?.trim();
    const code = this.enteredOtp?.trim();

    if (!target || !code) {
      this.otpMsg = 'Please enter both your identifier and the 6-digit OTP.';
      return;
    }

    this.otpLoading = true;
    this.otpMsg = '';

    this._service.verifyOtp(target, code, this.otpRole).subscribe({
      next: (res: any) => {
        this.otpLoading = false;
        console.log('OTP verified successfully', res);

        sessionStorage.clear();
        const role = res.role || 'user';
        const userObj = res.user || res.doctor || {};
        const email = userObj.email || (target.includes('@') ? target : `${target}@hms.patient.com`);
        const displayName = userObj.username || userObj.doctorname || this.getNameFromEmail(email);

        sessionStorage.setItem('loggedUser', email);
        sessionStorage.setItem('USER', role);
        sessionStorage.setItem('ROLE', role);
        sessionStorage.setItem('username', displayName);
        sessionStorage.setItem('name', displayName);
        sessionStorage.setItem('gender', userObj.gender || 'male');

        if (res.token) {
          sessionStorage.setItem('TOKEN', res.token.startsWith('Bearer ') ? res.token : `Bearer ${res.token}`);
        }

        if (role === 'doctor') {
          sessionStorage.setItem('doctorname', displayName);
          this._router.navigate(['/doctordashboard']);
        } else {
          this._router.navigate(['/userdashboard']);
        }
      },
      error: (err: any) => {
        this.otpLoading = false;
        this.otpMsg = err?.error?.message || 'Invalid or expired OTP. Please try again.';
      }
    });
  }

  fillDemoOtp(): void {
    if (this.demoOtpCode) {
      this.enteredOtp = this.demoOtpCode;
    }
  }

  private startOtpCooldown(): void {
    this.otpCooldown = 60;
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    this.cooldownTimer = setInterval(() => {
      if (this.otpCooldown > 0) {
        this.otpCooldown--;
      } else {
        clearInterval(this.cooldownTimer);
      }
    }, 1000);
  }

  // ================= GOOGLE OAUTH SIGN-IN =================
  openGooglePrompt(): void {
    this.googleEmailInput = 'mdtabishfiroz04@gmail.com';
    this.googleNameInput = 'Tabish Firoz';
    this.googlePromptOpen = true;
  }

  closeGooglePrompt(): void {
    this.googlePromptOpen = false;
  }

  submitGoogleOAuth(email: string, name: string): void {
    if (!email) return;

    this.isGoogleLoading = true;
    const profile = {
      email: email.trim(),
      name: name.trim() || this.getNameFromEmail(email),
      googleId: 'g_' + Math.random().toString(36).substring(2, 10),
      imageUrl: 'assets/img/maleuser.png'
    };

    this._service.googleOAuthLogin(profile).subscribe({
      next: (res: any) => {
        this.isGoogleLoading = false;
        this.googlePromptOpen = false;
        console.log('Google OAuth successful', res);

        sessionStorage.clear();
        sessionStorage.setItem('loggedUser', profile.email);
        sessionStorage.setItem('USER', 'user');
        sessionStorage.setItem('ROLE', 'user');
        sessionStorage.setItem('username', profile.name);
        sessionStorage.setItem('name', profile.name);
        sessionStorage.setItem('gender', 'male');

        if (res?.token) {
          sessionStorage.setItem('TOKEN', res.token.startsWith('Bearer ') ? res.token : `Bearer ${res.token}`);
        }

        this._router.navigate(['/userdashboard']);
      },
      error: (err: any) => {
        this.isGoogleLoading = false;
        this.msg = err?.error?.message || 'Google sign-in encountered an error. Please try again.';
      }
    });
  }

  private handleRememberMe(): void {
    if (this.rememberMe) {
      localStorage.setItem('rememberedEmail', this.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  }

  private getNameFromEmail(email: string): string {
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    return namePart
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
