import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;

  connect(userId: string) {
    if (this.socket) return; // prevent multiple connections

    this.socket = io('http://localhost:8080', {
      auth: { userId },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });
  }

  sendMessage(toUserId: string, message: string) {
    this.socket.emit('private_message', { toUserId, message });
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
