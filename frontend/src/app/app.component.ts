import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AvisoCookiesComponent } from './components/aviso-cookies.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AvisoCookiesComponent],
  template: '<router-outlet /><app-aviso-cookies />',
})
export class AppComponent {}
