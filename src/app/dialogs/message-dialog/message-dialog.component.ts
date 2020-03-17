import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
    styleUrls: ['./message-dialog.component.scss']

})
export class MessageDialogComponent {
	mode: string;
	value: string;

	constructor(
		public dialogRef: MatDialogRef<MessageDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any) {

		this.mode = this.data.mode || 'confirm';
		this.value = this.data.value;
    }

    drawStart() {
    }

}
