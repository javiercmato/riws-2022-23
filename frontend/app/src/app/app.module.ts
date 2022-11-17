import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatInputModule } from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon'; 
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ShopComponent } from './shop/shop.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchService } from './services/search.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    ShopComponent
  ],
  imports: [

    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,

    ReactiveFormsModule,
    FormsModule,

    HttpClientModule,

    BrowserModule,
    AppRoutingModule,
    NoopAnimationsModule
  ],
  providers: [SearchService],
  bootstrap: [AppComponent]
})
export class AppModule { }
