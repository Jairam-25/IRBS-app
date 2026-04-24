import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

export const AuthGuard: CanActivateFn = (route, state: RouterStateSnapshot) => {

  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return true;
  }

  // FIXED: state is now available
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};