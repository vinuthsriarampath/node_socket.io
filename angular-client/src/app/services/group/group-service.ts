import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {GroupDto} from '../../types/groupDto';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private readonly apiUrl:string = 'http://localhost:8080/api/groups'

  constructor(private readonly http:HttpClient) {}

  createGroup(name:string,members:string[]): Observable<GroupDto>{
    return this.http.post<GroupDto>(this.apiUrl,{name,members});
  }

  getAllGroupsRelatedToUser(): Observable<GroupDto[]>{
    return this.http.get<GroupDto[]>(this.apiUrl);
  }
}


