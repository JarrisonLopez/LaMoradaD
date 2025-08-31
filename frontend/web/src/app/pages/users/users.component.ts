import { Component } from '@angular/core';
import { NgIf, NgFor, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [NgIf, NgFor, JsonPipe, FormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  users: any[] = [];
  roles: any[] = [];
  form = { name: '', email: '', password: '', roleId: undefined as number | undefined };

  constructor(private usersSvc: UsersService, private rolesSvc: RolesService) {}
  ngOnInit() { this.reload(); }
  reload() { this.usersSvc.list().subscribe(u => this.users = u);
             this.rolesSvc.list().subscribe(r => this.roles = r); }
  add() {
    this.usersSvc.create(this.form).subscribe(() => {
      this.form = { name: '', email: '', password: '', roleId: undefined };
      this.reload();
    });
  }
}
