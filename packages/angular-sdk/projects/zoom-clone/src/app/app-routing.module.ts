import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActiveCallService } from './active-call.service';
import { CallLobbyComponent } from './call-lobby/call-lobby.component';
import { CallComponent } from './call/call.component';
import { ConnectUserService } from './connect-user.service';
import { DisconnectUserService } from './disconnect-user.service';
import { UserSelectorComponent } from './user-selector/user-selector.component';

const routes: Routes = [
  {
    path: 'user-selector',
    component: UserSelectorComponent,
    canActivate: [DisconnectUserService],
  },
  {
    path: 'call-lobby',
    component: CallLobbyComponent,
    canActivate: [ConnectUserService],
  },
  {
    path: 'call',
    component: CallComponent,
    canActivate: [ConnectUserService, ActiveCallService],
  },
  { path: '', pathMatch: 'full', redirectTo: 'user-selector' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
