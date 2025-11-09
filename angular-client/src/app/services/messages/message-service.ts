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

  getAllMessagesBySenderIdAndReceiverId(userId: string, before?: string): Observable<MessageDto[]>{
    const params: any = {};
    if (before) params.before = before;
    params.limit = 20;

    return this.http.get<MessageDto[]>(`${this.apiUrl}/${userId}`, { params })
  }

  getUnreadCounts(): Observable<{senderId: string; count: number}[]>{
    return this.http.get<{senderId: string; count: number}[]>(`${this.apiUrl}/unread`);
  }

  updateMessage(updatedMessage:MessageDto): Observable<MessageDto>{
    return this.http.patch<MessageDto>(`${this.apiUrl}/update`, {message:updatedMessage});
  }

  deleteMessage(messageId:string):Observable<MessageDto>{
    return this.http.delete<MessageDto>(`${this.apiUrl}/delete/${messageId}`);
  }
}
