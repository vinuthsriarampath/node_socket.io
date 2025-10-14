import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private readonly http:HttpClient){}

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, {withCredentials:true})
  }
  
}
