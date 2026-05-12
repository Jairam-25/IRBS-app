import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  group
} from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('routeAnimations', [

      transition('* <=> *', [

        // initial state
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%'
          })
        ], { optional: true }),

        group([

          // leave animation
          query(':leave', [
            animate('250ms ease',
              style({
                opacity: 0,
                transform: 'translateX(-40px)'
              })
            )
          ], { optional: true }),

          // enter animation
          query(':enter', [
            style({
              opacity: 0,
              transform: 'translateX(40px)'
            }),
            animate('300ms ease',
              style({
                opacity: 1,
                transform: 'translateX(0)'
              })
            )
          ], { optional: true })

        ])

      ])

    ])
  ]
})
export class AppComponent {

  getRouteAnimation(outlet: any) {
    return outlet?.activatedRouteData?.['animation'];
  }
}