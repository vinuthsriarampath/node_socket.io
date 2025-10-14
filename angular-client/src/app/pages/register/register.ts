import { Component } from '@angular/core';
import { Auth } from '../../services/auth/auth';
import { Router } from '@angular/router';
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  userDetails = {
    firstName: '',
    lastName: '',
    dob: '',
    address: '',
    phone: '',
    email: '',
    password: ''
  }

  constructor(private readonly auth:Auth, private readonly router:Router){}

  onSubmit(){
    
    this.auth.registerUser(this.userDetails).subscribe({
      next: () => {
        this.router.navigate([''])
      },
      error: (err) => {
        console.error(err);
      }
    })
  }
}
