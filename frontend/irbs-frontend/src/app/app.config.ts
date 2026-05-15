import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'; // ← add withInterceptors
 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
 
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
 
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
 
    provideAnimations(),
 
    importProvidersFrom(
      MatFormFieldModule,
      MatInputModule,
      MatAutocompleteModule,
      MatIconModule,
      MatButtonModule
    )
  ]
};