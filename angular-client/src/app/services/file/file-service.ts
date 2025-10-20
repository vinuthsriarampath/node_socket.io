import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly apiUrl:string = 'http://localhost:8080/api/files'

  constructor(private readonly http:HttpClient) {}

  uploadFile(formData:FormData): Observable<{ fileUrl: string }>{
    return this.http.post<{ fileUrl: string }>(`${this.apiUrl}/chat/upload`, formData);
  }
}


