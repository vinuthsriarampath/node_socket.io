import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { UserService } from '../../services/user/user-service';
import { catchError, last, Observable, of } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [
    JsonPipe,
    AsyncPipe,
    CommonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  currentUser$: Observable<any>;

  constructor(private readonly userService:UserService,private readonly authService:Auth , private readonly router:Router ){
    this.currentUser$=this.userService.getCurrentUser().pipe(
      catchError(err => {
        alert(err.message);
        return of(null); // Fallback to null or empty object on error
      })
    );
  }

  logout(){
    this.authService.logout().subscribe({
      next:(res)=>{
        console.info(res);
        this.router.navigate(['']);
        alert(res.message);
      },
      error:(err)=>{
        console.error(err.message);
      }
    })
  }
}
