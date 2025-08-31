import { Component } from '@angular/core';
import { NgFor, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../../services/roles.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [NgFor, JsonPipe, FormsModule],
  templateUrl: './roles.component.html',
})
export class RolesComponent {
  roles: any[] = [];
  name = '';
  constructor(private rolesSvc: RolesService) {}
  ngOnInit() { this.load(); }
  load() { this.rolesSvc.list().subscribe(r => this.roles = r); }
  add() {
    if (!this.name.trim()) return;
    this.rolesSvc.create(this.name).subscribe(() => { this.name=''; this.load(); });
  }
}
