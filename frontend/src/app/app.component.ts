import { Component } from '@angular/core';
import { BookingsPageComponent } from './bookings/bookings-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BookingsPageComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {}
