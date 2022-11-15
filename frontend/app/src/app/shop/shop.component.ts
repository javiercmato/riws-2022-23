import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent implements OnInit {
  filters: FormGroup = new FormGroup({
    prices: new FormGroup({
      priceAll: new FormControl<boolean>(true),
      price1: new FormControl<boolean>(false),
      price10: new FormControl<boolean>(false),
      price50: new FormControl<boolean>(false),
      priceHigh: new FormControl<boolean>(false),
    }),
    categories: new FormGroup({
      categoryAll: new FormControl<boolean>(true),
      category1: new FormControl<boolean>(false),
    }),
    offers: new FormGroup( {
      offersAll: new FormControl<boolean>(true),
    }),
  });
  allComplete: boolean = false;

  constructor(
    private searchService: SearchService
  ) {}

  ngOnInit(): void {}

  updateAllComplete() {
    //this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    this.allComplete =
      this.filters.get('prices')?.get('price1')?.value &&
      this.filters.get('prices')?.get('price10')?.value &&
      this.filters.get('prices')?.get('price50')?.value &&
      this.filters.get('prices')?.get('priceHigh')?.value
  }

  someComplete(): boolean {
    return this.filters.get('prices')?.get('price1')?.value ||
      this.filters.get('prices')?.get('price10')?.value ||
      this.filters.get('prices')?.get('price50')?.value ||
      this.filters.get('prices')?.get('priceHigh')?.value &&
      !this.allComplete;
  }

  setAll(completed: boolean) {
    this.allComplete = completed;
    this.filters.get('prices')?.get('price1')?.patchValue(completed);
    this.filters.get('prices')?.get('price10')?.patchValue(completed);
    this.filters.get('prices')?.get('price50')?.patchValue(completed);
    this.filters.get('prices')?.get('priceHigh')?.patchValue(completed);
  }
}

