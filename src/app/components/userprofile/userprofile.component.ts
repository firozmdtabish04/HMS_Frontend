import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

@Component({
  standalone: false,
  selector: 'app-userprofile',
  templateUrl: './userprofile.component.html',
  styleUrls: ['./userprofile.component.css']
})
export class UserprofileComponent implements OnInit {
  profileDetails: Observable<User[]> | undefined;
  user: User = new User();
  msg = '';
  currRole = '';
  loggedUser = '';
  temp = false;
  isEditMode = false;

  constructor(
    private _service: UserService,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.loggedUser = sessionStorage.getItem('loggedUser') || '';
    this.currRole = sessionStorage.getItem('ROLE') || 'User';
    this.getProfileDetails(this.loggedUser);
  }

  editProfile(): void {
    this.isEditMode = true;
    this.msg = '';
    this.temp = false;
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.msg = '';
    this.temp = false;
    this.getProfileDetails(this.loggedUser);
  }

  getProfileDetails(loggedUser: string): void {
    this.profileDetails = this._service.getProfileDetails(loggedUser);
    this.profileDetails.subscribe({
      next: (data: User[]) => {
        if (data && data.length > 0)
        {
          this.user = { ...data[0] };
        }
      },
      error: (error) => {
        console.error('Error fetching user profile', error);
      }
    });
  }

  updateUserProfile(): void {
    this.msg = '';
    this.temp = false;

    this._service.UpdateUserProfile(this.user).subscribe({
      next: (data) => {
        console.log('UserProfile Updated successfully', data);
        this.msg = 'Profile Updated Successfully !!!';
        this.temp = true;
        this.isEditMode = false;

        if (data) {
          this.user = { ...data };
        }

        // Update sessionStorage immediately so Header and Dashboard reflect changes
        if (this.user.username) {
          sessionStorage.setItem('username', this.user.username);
          sessionStorage.setItem('name', this.user.username);
        }
        if (this.user.gender) {
          sessionStorage.setItem('gender', this.user.gender);
        }
        if (this.user.email) {
          sessionStorage.setItem('loggedUser', this.user.email);
        }

        // Immediately update view without requiring refresh
        this.profileDetails = of([this.user]);
        window.dispatchEvent(new Event('storage'));

        this.getProfileDetails(this.user.email || this.loggedUser);

        setTimeout(() => {
          this._router.navigate(['/userdashboard']);
        }, 2500);
      },
      error: (error) => {
        console.error('Profile Updation Failed', error);
        this.msg = 'Profile Updation Failed. Please try again.';
      }
    });
  }

  backToDashboard(): void {
    this._router.navigate(['/userdashboard']);
  }
}
