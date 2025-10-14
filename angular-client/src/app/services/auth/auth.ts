import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, tap, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl:string = 'http://localhost:8080/api/auth';

  private accessToken$ = new BehaviorSubject<string | null>(null); // store the access token in-memory only for security 

  constructor(private readonly http:HttpClient){}

  registerUser(userDetails:any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`,userDetails);
  }
  
  login(credentials: any): Observable<any> {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        tap(res => {
          this.accessToken$.next(res.accessToken); // set the access token to the accessToken$ variable
        }),
        catchError(err => {
          console.error('Login error:', err);
          return throwError(() => err.error?.message || 'Login failed');
        })
      );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap(res => {
          this.accessToken$.next(res.accessToken); // set the access token to the accessToken$ variable if the token is refreshed successfully
        }),
        catchError(err => {
          let errorMessage = err.error?.message || 'Refresh failed';
          this.clearAuth();
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this.clearAuth()),
        catchError(err => {
          // Improved: Handle logout errors gracefully (e.g., if already revoked)
          console.error('Logout error:', err);
          this.clearAuth();
          return throwError(() => err);
        })
      );
  }

  private clearAuth(): void {
    this.accessToken$.next(null); // clear the access token from the accessToken$ variable
  }

  getAccessToken(): string | null {
    return this.accessToken$.value;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken$.value; // return true if the access token is not null
  }
}
