import {Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {BehaviorSubject, Observable} from 'rxjs';
import {Auth} from '../auth/auth';
import {UserService} from '../user/user-service';
import {MessageDto} from '../../types/messageDto';
import {MessageNotification} from '../../types/message_notification';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;

  private readonly onlineUsersSubject = new BehaviorSubject<Set<string>>(new Set<string>());
  onlineUsers$ = this.onlineUsersSubject.asObservable();

  private readonly messageReadSubject = new BehaviorSubject<MessageDto | null>(null);
  messageRead$ = this.messageReadSubject.asObservable();

  private readonly notificationSubject = new BehaviorSubject<MessageNotification | null>(null);
  notification$ = this.notificationSubject.asObservable();

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

    this.socket.on('notification', (payload) => {
      this.notificationSubject.next(payload);
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

  //Send a message to a user
  sendMessage(toUserId: string, message: string) {
    this.socket.emit('private_message', {toUserId, message});
  }

  //listen for messages
  onMessage(): Observable<MessageDto> {
    return new Observable(observer => {

      const handler = (data: MessageDto) => {
        observer.next(data);
      };
      this.socket.on('receive_message', handler); //listen to messages received from another user
      this.socket.on('message_sent',handler); //listen to messages successfully send to another user

      return () => { //close listeners
        this.socket.off('receive_message', handler);
        this.socket.off('message_sent',handler)
      };
    });
  }

  //notify the recipient user that the sender is typing
  sendTyping(toUserId: string) {
    this.socket.emit("typing", { toUserId });
  }

  //notify the recipient user that the sender has stopped typing
  sendStopTyping(toUserId: string) {
    this.socket.emit("stop_typing", { toUserId });
  }

  //listening for notifications from other users that they are typing
  onTyping(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on("user_typing", (data) => observer.next(data));
    });
  }

  //listening for notifications from other users that they have stopped typing
  onStopTyping(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on("user_stopped_typing", (data) => observer.next(data));
    });
  }


  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined as any;
    }
  }
}
