import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private base = '/api';
  constructor(private http: HttpClient) {}
  list() { return this.http.get<any[]>(`${this.base}/roles`); }
  create(name: string) { return this.http.post(`${this.base}/roles`, { name }); }
}
