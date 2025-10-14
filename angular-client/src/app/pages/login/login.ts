import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [RouterLink,FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  credentials = {
    email: '',
    password: '',
  }

  constructor(private readonly auth:Auth, private readonly router:Router){}

  onSubmit() {
    this.auth.login(this.credentials).subscribe({
      next: ()=> {
        this.router.navigate(['dashboard'])
      },
      error: (err)=>{
        alert(err)
      }
    })
  }

}
