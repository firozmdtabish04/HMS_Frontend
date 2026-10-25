import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  loggedUser = '';
  currRole = '';
  title = 'Hospital Management System';
  homeRoute = '/';
  currentDateTime = new Date();

  displayUserName = '';
  isDropdownOpen = false;

  readonly emergencyPhoneDisplay = '+91 8102946894';
  readonly emergencyPhone = '918102946894';

  constructor(private router: Router) { } 

  ngOnInit(): void {
    this.loadHeaderState();
    this.startClock();
  }

  @HostListener('window:storage')
  onStorageChange(): void {
    this.loadHeaderState();
  }

  loadHeaderState(): void {
    this.loggedUser = sessionStorage.getItem('loggedUser') || '';
    this.currRole = (sessionStorage.getItem('ROLE') || '').toLowerCase();

    const storedUsername = sessionStorage.getItem('username') || '';
    const storedDoctorName = sessionStorage.getItem('doctorname') || '';
    const storedName = sessionStorage.getItem('name') || '';

    if (this.currRole === 'admin')
    {
      this.title = 'Admin Dashboard';
      this.homeRoute = '/admindashboard';
      this.displayUserName = storedName || 'Admin';
    } else if (this.currRole === 'doctor')
    {
      this.title = 'Doctor Dashboard';
      this.homeRoute = '/doctordashboard';
      this.displayUserName = storedDoctorName || storedName || this.formatNameFromEmail(this.loggedUser);
    } else if (this.currRole === 'user')
    {
      this.title = 'User Dashboard';
      this.homeRoute = '/userdashboard';
      this.displayUserName = storedUsername || storedName || this.formatNameFromEmail(this.loggedUser);
    } else
    {
      this.title = 'Hospital Management System';
      this.homeRoute = '/';
      this.displayUserName = storedName || this.formatNameFromEmail(this.loggedUser);
    }
  }

  private startClock(): void {
    setInterval(() => {
      this.currentDateTime = new Date();
    }, 1000);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  goToDashboard(): void {
    this.closeDropdown();
    this.router.navigate([this.homeRoute]);
  }

  logout(): void {
    this.closeDropdown();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  openEmergencyWhatsApp(): void {
    const userName = this.displayUserName || this.loggedUser || 'A patient';
    const userRole = this.currRole ? this.currRole.toUpperCase() : 'GUEST';

    const baseMessage =
      `Emergency Assistance Request\n\n` +
      `Hello, I need immediate medical assistance.\n` +
      `Name: ${userName}\n` +
      `Role: ${userRole}\n` +
      `Requested From: Hospital Management System\n` +
      `Please respond as soon as possible.`;

    if (!navigator.geolocation)
    {
      this.openWhatsApp(baseMessage);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

        const messageWithLocation =
          `${baseMessage}\n` +
          `Current Location: ${mapsLink}`;

        this.openWhatsApp(messageWithLocation);
      },
      () => {
        this.openWhatsApp(baseMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  private openWhatsApp(message: string): void {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${this.emergencyPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  private formatNameFromEmail(email: string): string {
    if (!email)
    {
      return 'User';
    }

    const namePart = email.split('@')[0];

    return namePart
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const clean = name.trim().replace(/^dr\.?\s*/i, '');
    const parts = clean.split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
