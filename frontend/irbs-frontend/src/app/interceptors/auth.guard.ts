import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../_services/auth-service/auth.service';

export const AuthGuard: CanActivateFn = (route, state: RouterStateSnapshot) => {

  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.getToken()) {
    return true;
  }

    // FIXED: state is now available
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};