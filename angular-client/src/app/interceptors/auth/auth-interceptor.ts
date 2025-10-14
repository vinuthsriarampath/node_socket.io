import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../../services/auth/auth';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  // Skip auth for login, register, and refresh endpoints
  if (
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register') ||
    req.url.includes('/api/auth/refresh')
  ) {
    return next(req);
  }

  // Add token to requests
  const token = auth.getAccessToken();
  let authReq = req;
  if (token) {
    authReq = addTokenHeader(authReq, token);
  }
  return next(authReq).pipe(
    catchError((error:HttpErrorResponse)=>{

      if (error.status === 429) {
        const rateLimitMsg = error.error?.message || 'Too many requests - please wait and try again.';
        console.warn('Rate limited:', rateLimitMsg);
        return throwError(() => new Error(rateLimitMsg));  // Could alert user here if desired
      }

      if(error.status === 401 && token){ // if requests fails with 401 it will retry the reqest again
        return handle401Error(auth, authReq, next);
      }

      return throwError(() => error) // throw the error
    })
  );
};

// SET the token to the request header
function addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`)
  });
}

// Retry the request after refreshing and geting a new access token
function handle401Error(auth: Auth,request:HttpRequest<any>, next: HttpHandlerFn){
  if (!isRefreshing) { // Ensure only the first request triggers the refresh token
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return auth.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken); // store the newest access token in the refreshTokenSubject
        return next(addTokenHeader(request, response.accessToken)); // retries the failed request
      }),
      catchError((err) => {
        isRefreshing = false;
        auth.logout().subscribe();
        return throwError(() => err); // if again failed throw the error
      })
    );
  }

  return refreshTokenSubject.pipe( // All other requests subscribe untill a change in refreshTokenSubject
    filter(token => token !== null), // filter outs initial null values 
    take(1),// takes the first non-null token 
    switchMap((token) => next(addTokenHeader(request, token!))) // retries the failed request
  );
}