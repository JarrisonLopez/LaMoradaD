import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = '/api';
  constructor(private http: HttpClient) {}
  list() { return this.http.get<any[]>(`${this.base}/users`); }
  create(body: {name:string; email:string; password:string; roleId?:number}) {
    return this.http.post(`${this.base}/users`, body);
  }
}
