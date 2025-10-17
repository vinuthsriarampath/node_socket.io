import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, BehaviorSubject, map } from 'rxjs';
import { UserService } from '../../services/user/user-service';
import { Auth } from '../../services/auth/auth';
import { SocketService } from '../../services/sokcets/socket-service';
import { MessageService } from '../../services/messages/message-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  users$!: Observable<any[]>;
  currentUserId: string = '';

  private readonly selectedUserSubject = new BehaviorSubject<any | null>(null);
  selectedUser$ = this.selectedUserSubject.asObservable();

  private readonly messagesSubject = new BehaviorSubject<{ from: string; message: string }[]>([]);
  messages$ = this.messagesSubject.asObservable();

  messageText = '';
  private messageSub!: Subscription;

  constructor(
    private readonly userService: UserService,
    private readonly authService: Auth,
    protected readonly socketService: SocketService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit() {
    this.users$ = this.userService.getAllUsersExceptMe();

    this.userService.getCurrentUser().subscribe(user => {
      this.currentUserId = user.id;
      this.socketService.connect();

      this.messageSub = this.socketService.onMessage().subscribe(data => {
        const selected = this.selectedUserSubject.value;

        // Map server payload to UI format
        const incoming = { from: data.senderId, message: data.message };

        // Show only if chat is currently open between sender and receiver
        if (
          selected &&
          ((incoming.from === selected.id && data.receiverId === this.currentUserId) || // received message
            (incoming.from === this.currentUserId && data.receiverId === selected.id))   // sent  message
        ) {
          const updated = [...this.messagesSubject.value, incoming];
          this.messagesSubject.next(updated);
        }
      });
    });
  }

  selectUser(user: any) {
    this.selectedUserSubject.next(user);
    this.messageService
      .getAllMessagesBySenderIdAndReceiverId(user.id)
      .pipe(map(msg => msg.map(m => ({ from: m.senderId, message: m.message }))))
      .subscribe(messages => this.messagesSubject.next(messages));
  }

  sendMessage() {
    const selectedUser = this.selectedUserSubject.value;
    if (!this.messageText.trim() || !selectedUser) return;

    // Send message to server
    this.socketService.sendMessage(selectedUser.id, this.messageText);

    // Optimistically add message to local UI
    const updated = [...this.messagesSubject.value, { from: this.currentUserId, message: this.messageText }];
    this.messagesSubject.next(updated);

    this.messageText = '';
  }

  ngOnDestroy() {
    if (this.messageSub) this.messageSub.unsubscribe();
    this.socketService.disconnect();
  }
}
