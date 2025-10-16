import { CommonModule } from '@angular/common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user/user-service';
import { Auth } from '../../services/auth/auth';
import {Observable, Subscription} from 'rxjs';
import {SocketService} from '../../services/sokcets/socket-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  users$!: Observable<any[]>;
  currentUserId: string = '';
  selectedUser: any = null;
  messageText = '';
  messages: { from: string; message: string }[] = [];

  private messageSub!: Subscription;

  constructor(
    private readonly userService: UserService,
    private readonly authService: Auth,
    private readonly socketService:SocketService
  ) {}

  ngOnInit() {
    this.users$ = this.userService.getAllUsersExceptMe();

    this.userService.getCurrentUser().subscribe(user => {
      this.socketService.connect();

      this.messageSub = this.socketService.onMessage().subscribe(data => {
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

    this.socketService.sendMessage(this.selectedUser.id, this.messageText);
    this.messages.push({ from: this.currentUserId, message: this.messageText });
    this.messageText = '';
  }

  ngOnDestroy() {
    if (this.messageSub) this.messageSub.unsubscribe();
    this.socketService.disconnect();
  }
}
