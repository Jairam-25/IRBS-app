import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-popup',
  standalone: true,
  template: `
    <div class="popup-container">
      <h2>{{ data.title }}</h2>
      <p>{{ data.message }}</p>

      <button (click)="close()">OK</button>
    </div>
  `,
  styles: [`
    .popup-container {
  padding: 24px 20px;
  text-align: center;
  animation: popupFade 0.25s ease;
}

h2 {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 600;
  color: #222;
}

p {
  margin: 0 0 20px;
  color: #666;
  font-size: 14px;
}

button {
  background: #ff7a18;
  color: white;
  border: none;
  padding: 8px 22px;
  border-radius: 22px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}

button:hover {
  background: #ffb347;
}
@keyframes popupFade {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.cdk-overlay-backdrop {
  backdrop-filter: blur(20px);
  background: rgba(0,0,0,0.2);
}
  `]
})
export class PopupComponent {

  constructor(
    private dialogRef: MatDialogRef<PopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close() {
    this.dialogRef.close();
  }
}