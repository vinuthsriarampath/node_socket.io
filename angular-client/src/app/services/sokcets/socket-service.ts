import {Injectable} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {Observable} from 'rxjs';
import {Auth} from '../auth/auth';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;

  constructor(private readonly auth: Auth) {
  }

  connect() {
    if (this.socket?.connected) return;

    const token = this.auth.getAccessToken();

    this.socket = io('http://localhost:8080', {
      auth: {token} // token will be sent in the handshake
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
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


  sendMessage(toUserId: string, message: string) {
    this.socket.emit('private_message', {toUserId, message});
  }

  onMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('receive_message', data => {
        observer.next(data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined as any;
    }
  }
}
