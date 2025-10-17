import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:8080/api/users';

  constructor(private readonly http:HttpClient){}

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, {withCredentials:true})
  }

  getAllUsersExceptMe(): Observable<any>{
    return this.http.get(`${this.apiUrl}/all-except-me`);
  }

  getAllOnlineUsers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/online`);
  }
}
