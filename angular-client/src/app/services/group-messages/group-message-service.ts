import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {GroupMessageDto} from '../../types/groupMessageDto';

@Injectable({
  providedIn: 'root'
})
export class GroupMessageService {

  private readonly apiUrl:string = `http://localhost:8080/api/messages/groups`

  constructor(private readonly http:HttpClient) {}

  getAllMessagesByGroupId(groupId:string, before?:string): Observable<GroupMessageDto[]> {
    const params:any = {};
    if(before) params.before = before;
    params.limit = 20;
    return this.http.get<GroupMessageDto[]>(`${this.apiUrl}/${groupId}`, {params});
  }
}
