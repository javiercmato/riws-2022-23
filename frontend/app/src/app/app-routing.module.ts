import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShopComponent } from './shop/shop.component';

const routes: Routes = [
  {
    path: "",
    component: ShopComponent
  },
  // {
  //   path: "detail/:name",
  //   component: DetailProductoComponent
  // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
