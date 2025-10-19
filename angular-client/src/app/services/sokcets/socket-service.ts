import {Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {BehaviorSubject, Observable} from 'rxjs';
import {Auth} from '../auth/auth';
import {UserService} from '../user/user-service';
import {MessageDto} from '../../types/messageDto';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;

  private readonly onlineUsersSubject = new BehaviorSubject<Set<string>>(new Set<string>());
  onlineUsers$ = this.onlineUsersSubject.asObservable();

  private readonly messageReadSubject = new BehaviorSubject<MessageDto | null>(null);
  messageRead$ = this.messageReadSubject.asObservable();

  constructor(
    private readonly auth: Auth,
    private readonly userService: UserService
  ) {
    this.userService.getAllOnlineUsers().subscribe(userIds => {
      this.onlineUsersSubject.next(new Set(userIds));
    });
  }

  connect() {
    if (this.socket?.connected) return;

    const token = this.auth.getAccessToken();

    this.socket = io('http://localhost:8080', {
      auth: {token}, // token will be sent in the handshake
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    this.socket.on('user_status_change', ({userId, status}) => {
      const current = new Set(this.onlineUsersSubject.value);
      if (status === 'online') current.add(userId);
      else current.delete(userId);
      this.onlineUsersSubject.next(current);
    });

    this.socket.on('connect', () => console.info('Socket connected:', this.socket?.id));
    this.socket.on('disconnect', async (reason: any) => {
      console.warn('Socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'unauthorized') {
        // server kicked us -> try refresh & reconnect
        this.auth.refreshToken().subscribe((data)=>{
          if(data.accessToken){
            console.log('🔄 Access token refreshed, reconnecting...');
            this.connect();
          }else {
            console.error('❌ Token refresh failed, logging out...');
            this.auth.logout();
          }
        });
      }
    });

    // listen for message_read notifications
    this.socket.on('message_read', (payload: MessageDto) => {
      this.messageReadSubject.next(payload);
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('Socket connect_error:', err?.message || err);
      // If unauthorized -> tell the app. Later we'll refresh and reconnect in Feature 5.
      if (err && err.message === 'unauthorized') {
        // You can broadcast a subject/event here to trigger refresh flow or UI notification
        alert(err.message);
      }
    });
  }

  // allow components to emit mark_as_read
  markMessagesAsRead(messageIds: string[]) {
    if (!this.socket) return;
    this.socket.emit('mark_as_read', { messageIds });
  }

  sendMessage(toUserId: string, message: string) {
    this.socket.emit('private_message', {toUserId, message});
  }

  onMessage(): Observable<MessageDto> {
    return new Observable(observer => {

      const handler = (data: MessageDto) => {
        observer.next(data);
      };
      this.socket.on('receive_message', handler);
      this.socket.on('message_sent',handler)

      return () => {
        this.socket.off('receive_message', handler);
        this.socket.off('message_sent',handler)
      };
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined as any;
    }
  }
}
