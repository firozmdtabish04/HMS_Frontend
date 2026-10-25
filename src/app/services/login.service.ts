import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Doctor } from '../models/doctor';
import { User } from '../models/user';
import { map } from "rxjs/operators";

const NAV_URL = environment.apiURL;

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  user = new User();
  doctor = new Doctor();

  constructor(private _http: HttpClient) { }

  public loginUserFromRemote(user: User): Observable<any> {
    return this._http.post<any>(`${NAV_URL}/loginuser`, user).pipe(
      map(data => {
        sessionStorage.setItem('USER', user.email);
        sessionStorage.setItem('ROLE', 'user');
        if (data.token) {
          sessionStorage.setItem('TOKEN', `Bearer ${data.token}`);
        }
        return data;
      })
    );
  }

  public loginDoctorFromRemote(doctor: Doctor): Observable<any> {
    return this._http.post<any>(`${NAV_URL}/logindoctor`, doctor).pipe(
      map(data => {
        sessionStorage.setItem('USER', doctor.email);
        sessionStorage.setItem('ROLE', 'doctor');
        if (data.token) {
          sessionStorage.setItem('TOKEN', `Bearer ${data.token}`);
        }
        return data;
      })
    );
  }

  public sendOtp(identifier: string, role: string = 'user'): Observable<any> {
    return this._http.post<any>(`${NAV_URL}/send-otp`, { identifier, role });
  }

  public verifyOtp(identifier: string, otp: string, role: string = 'user'): Observable<any> {
    return this._http.post<any>(`${NAV_URL}/verify-otp`, { identifier, otp, role }).pipe(
      map(data => {
        if (data && data.token) {
          sessionStorage.setItem('TOKEN', `Bearer ${data.token}`);
        }
        return data;
      })
    );
  }

  public googleOAuthLogin(googleProfile: { email: string; name: string; imageUrl?: string; googleId?: string }): Observable<any> {
    return this._http.post<any>(`${NAV_URL}/oauth/google`, googleProfile).pipe(
      map(data => {
        if (data && data.token) {
          sessionStorage.setItem('TOKEN', `Bearer ${data.token}`);
        }
        return data;
      })
    );
  }

  public adminLoginRemoteApi(email: string, password: string): Observable<any> {
    return this._http.post<any>(`${NAV_URL}/adminlogin`, { email, password }).pipe(
      map(data => {
        if (data && data.token) {
          sessionStorage.setItem('TOKEN', `Bearer ${data.token}`);
        }
        return data;
      })
    );
  }

  public adminLoginFromRemote(email: string, password: string): boolean {
    if (email === 'mdtabishfiroz04@gmail.com' && password === 'Akhil@04') {
      sessionStorage.setItem('USER', email);
      sessionStorage.setItem('loggedUser', email);
      sessionStorage.setItem('ROLE', "admin");
      // Fetch token in background
      this.adminLoginRemoteApi(email, password).subscribe({
        next: (res) => {
          if (res && res.token) {
            sessionStorage.setItem('TOKEN', `Bearer ${res.token}`);
          }
        },
        error: () => {}
      });
      return true;
    }
    return false;
  }

  isUserLoggedIn(): boolean {
    const user = sessionStorage.getItem('USER');
    return user !== null && user.length > 0;
  }

  isDoctorLoggedIn(): boolean {
    const user = sessionStorage.getItem('USER');
    const role = (sessionStorage.getItem('ROLE') || '').toLowerCase();
    return (user !== null && user.length > 0) && (role === 'doctor');
  }

  isAdminLoggedIn(): boolean {
    const user = sessionStorage.getItem('USER');
    const role = (sessionStorage.getItem('ROLE') || '').toLowerCase();
    return (user !== null && user.length > 0) && (role === 'admin');
  }

  getAuthenticatedToken(): string | null {
    return sessionStorage.getItem('TOKEN');
  }
 
  getAuthenticatedUser(): string | null {
    return sessionStorage.getItem('USER');
  }

  userType(): string | null {
    return sessionStorage.getItem('ROLE');
  }

}
