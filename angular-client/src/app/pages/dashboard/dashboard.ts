import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user/user-service';
import { Auth } from '../../services/auth/auth';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  users$!: Observable<any[]>;
  currentUserId: string = '';
  selectedUser: any = null;
  messageText = '';
  messages: { from: string; message: string }[] = [];
  private socket!: Socket;

  constructor(
    private readonly userService: UserService,
    private readonly authService: Auth
  ) {}

  ngOnInit() {
    this.users$ = this.userService.getAllUsersExceptMe();

    this.userService.getCurrentUser().subscribe(user => {
      this.currentUserId = user.id;

      this.socket = io('http://localhost:8080', {
        auth: { userId: user.id },
      });

      // Listen only after socket is created
      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('receive_message', (data) => {
        if (
          this.selectedUser &&
          (data.from === this.selectedUser.id || data.from === this.currentUserId)
        ) {
          this.messages.push(data);
        }
      });
    });
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.messages = []; // Optionally clear old chat when switching
  }

  sendMessage() {
    if (!this.messageText.trim() || !this.selectedUser) return;

    const payload = {
      toUserId: this.selectedUser.id,
      message: this.messageText.trim(),
    };

    this.socket.emit('private_message', payload);
    this.messages.push({ from: this.currentUserId, message: this.messageText });
    this.messageText = '';
  }
}
