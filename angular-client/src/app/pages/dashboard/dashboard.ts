import {CommonModule} from '@angular/common';
import {Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Observable, Subscription, BehaviorSubject} from 'rxjs';
import {UserService} from '../../services/user/user-service';
import {Auth} from '../../services/auth/auth';
import {SocketService} from '../../services/sokcets/socket-service';
import {MessageService} from '../../services/messages/message-service';
import {MessageDto} from '../../types/messageDto';
import {MessageNotification} from '../../types/message_notification';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  users$!: Observable<any[]>;
  currentUserId = '';

  private readonly selectedUserSubject = new BehaviorSubject<any | null>(null);
  selectedUser$ = this.selectedUserSubject.asObservable();

  private readonly messagesSubject = new BehaviorSubject<MessageDto[]>([]);
  messages$ = this.messagesSubject.asObservable();

  messageText = '';
  private messageSub!: Subscription;

  isTyping = false;
  typingUserId: string | null = null;
  typingTimeout: any;

  notifications: MessageNotification[] = [];
  unreadCounts = new Map<string, number>();

  constructor(
    private readonly userService: UserService,
    private readonly authService: Auth,
    protected readonly socketService: SocketService,
    private readonly messageService: MessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {
  }

  ngOnInit() {
    this.users$ = this.userService.getAllUsersExceptMe();

    this.userService.getCurrentUser().subscribe(user => {
      this.currentUserId = user.id;
      this.socketService.connect();

      /** Handle new messages */
      this.messageSub = this.socketService.onMessage().subscribe(data => {
        this.zone.run(() => {
          const selected = this.selectedUserSubject.value;
          if (
            selected &&
            ((data.senderId === selected.id && data.receiverId === this.currentUserId) ||
              (data.senderId === this.currentUserId && data.receiverId === selected.id))
          ) {
            this.isTyping = false;
            const updated = [...this.messagesSubject.value, data];
            this.messagesSubject.next(updated);

            if (data.senderId === selected.id) {
              const unreadIds = updated.filter(m => !m.read).map(m => m._id).filter(Boolean);
              this.socketService.markMessagesAsRead(unreadIds);
            }
          }
        });
      });

      /** Listen for read receipts */
      this.socketService.messageRead$.subscribe(evt => {
        if (!evt) return;
        this.zone.run(() => {
          const updated = this.messagesSubject.value.map(m =>
            m._id === evt._id ? {...m, read: true, readAt: evt.readAt} : m
          );
          this.messagesSubject.next(updated);
        });
      });

      /** Typing indicator */
      this.socketService.onTyping().subscribe(({fromUserId}) => {
        this.zone.run(() => {
          const selected = this.selectedUserSubject.value;
          if (selected && selected.id === fromUserId) {
            this.typingUserId = fromUserId;
            this.isTyping = true;

            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
              this.isTyping = false;
              this.cdr.markForCheck();
            }, 2000);

            this.cdr.markForCheck();
          }
        });
      });

      this.socketService.onStopTyping().subscribe(({fromUserId}) => {
        this.zone.run(() => {
          const selected = this.selectedUserSubject.value;
          if (selected && selected.id === fromUserId) {
            this.isTyping = false;
            this.cdr.markForCheck();
          }
        });
      });

      this.socketService.notification$.subscribe((notif) => {
        this.zone.run(() => {
          if (notif) {
            const selected = this.selectedUserSubject.value;
            // only show if the current chat isn't the sender
            if (!selected || selected.id !== notif.senderId) {
              this.notifications.push(notif);
              this.cdr.markForCheck();

              this.showToast(`${notif.message}...`);
            }
          }
        })
      });

      /** Load initial unread counts*/
      this.messageService.getUnreadCounts().subscribe(data => {
        data.forEach(item => this.unreadCounts.set(item.senderId, item.count));
      });

      /** Listen for real-time updates */
      this.socketService.unreadCounts$.subscribe(map => {
        this.unreadCounts = map;
        this.cdr.markForCheck();
      });


    });
  }

  selectUser(user: any) {
    this.isTyping = false;
    this.typingUserId = null;
    this.selectedUserSubject.next(user);

    this.messageService.getAllMessagesBySenderIdAndReceiverId(user.id).subscribe(messages => {
      this.zone.run(() => {
        this.messagesSubject.next(messages);

        if (this.notifications.some(n => n.senderId === user.id)) {
          this.notifications = this.notifications.filter(n => n.senderId !== user.id);
        }

        const unreadIds = messages
          .filter(m => m.receiverId === this.currentUserId && !m.read)
          .map(m => m._id)
          .filter(Boolean);

        if (unreadIds.length) {
          this.socketService.markMessagesAsRead(unreadIds);
          const readMessages = messages.map(m =>
            unreadIds.includes(m._id) ? {...m, read: true, readAt: new Date()} : m
          );
          this.messagesSubject.next(readMessages);
        }
      });
    });
  }

  onMessageInput() {
    const selectedUser = this.selectedUserSubject.value;
    if (selectedUser) {
      this.socketService.sendTyping(selectedUser.id);

      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.socketService.sendStopTyping(selectedUser.id);
      }, 1500);
    }
  }

  sendMessage() {
    const selectedUser = this.selectedUserSubject.value;
    if (!this.messageText.trim() || !selectedUser) return;
    this.socketService.sendMessage(selectedUser.id, this.messageText);
    this.messageText = '';
  }

  showToast(msg: string) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.className =
      'fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  hasNotificationFrom(userId: string | number): boolean {
    return Array.isArray(this.notifications) && this.notifications.some(n => n.senderId === userId);
  }

  ngOnDestroy() {
    if (this.messageSub) this.messageSub.unsubscribe();
    this.socketService.disconnect();
  }
}
