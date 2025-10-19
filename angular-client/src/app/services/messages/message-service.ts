import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {MessageDto} from '../../types/messageDto';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly apiUrl:string = 'http://localhost:8080/api/messages'
  constructor(private readonly http:HttpClient) {}

  getAllMessagesBySenderIdAndReceiverId(receiverId:string): Observable<MessageDto[]>{
    return this.http.get<MessageDto[]>(`${this.apiUrl}/${receiverId}`);
  }

  getUnreadCounts(): Observable<{senderId: string; count: number}[]>{
    return this.http.get<{senderId: string; count: number}[]>(`${this.apiUrl}/unread`);
  }
}
