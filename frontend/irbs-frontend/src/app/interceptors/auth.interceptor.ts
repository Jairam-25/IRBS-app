import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../_services/auth-service/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const platformId = inject(PLATFORM_ID);

  // DEBUG: confirm interceptor is running
  console.log('[AuthInterceptor] fired for:', req.url);
  console.log('[AuthInterceptor] isBrowser:', isPlatformBrowser(platformId));

  if (!isPlatformBrowser(platformId)) {
    console.log('[AuthInterceptor] SSR — skipping token');
    return next(req);
  }

  // DEBUG: check what keys exist in localStorage
  console.log('[AuthInterceptor] localStorage keys:', Object.keys(localStorage));

  const auth  = inject(AuthService);
  const token = auth.getToken();

  console.log('[AuthInterceptor] token found:', token ? `${token.substring(0, 20)}...` : 'NULL');

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    console.log('[AuthInterceptor] Authorization header set ✅');
    return next(cloned);
  }

  console.warn('[AuthInterceptor] No token — request sent WITHOUT Authorization ⚠️');
  return next(req);
};