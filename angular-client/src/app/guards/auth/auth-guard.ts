import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../services/auth/auth';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    console.log('Auth guard: Refresh succeeded, allowing access');
    return true; // return true if the access token is not null
  }

  // Asynchronously try refresh the token if access token is not found (e.g., after reload or OAuth redirect)
  return authService.refreshToken().pipe(
    map(() => {
      console.log('Auth guard: Refresh succeeded, allowing access');
      return true;
    }),
    catchError(() => {
      console.log('Auth guard: Refresh failed, redirecting to login');
      router.navigate(['']);
      return of(false);
    })
  );
};
