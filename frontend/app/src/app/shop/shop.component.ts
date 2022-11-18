import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ElasticService } from '../services/elastic-service';
import { Item } from './types';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html'
})
export class ShopComponent implements OnInit {
  filters: FormGroup = new FormGroup({
    prices: new FormGroup({
      priceAll: new FormControl<boolean>(true),
      price1: new FormControl<boolean>(false),
      price5: new FormControl<boolean>(false),
      price10: new FormControl<boolean>(false),
      price50: new FormControl<boolean>(false),
      priceHigh: new FormControl<boolean>(false),
    }),
    categories: new FormGroup({
      categoryAll: new FormControl<boolean>(true),
      productosFrescos: new FormControl<boolean>(false),
      conservas: new FormControl<boolean>(false),
      refrescos: new FormControl<boolean>(false),
      farmacia: new FormControl<boolean>(false),
      perfumes: new FormControl<boolean>(false),
      higiene: new FormControl<boolean>(false),
      limpieza: new FormControl<boolean>(false)
    }),
    offersAll: new FormControl<boolean>(false),
  });

  allPricesComplete: boolean = false;
  allCategoriesComplete: boolean = false;

  searchName: string = '';

  sort!: 'asc' | 'desc';

  items!: Item[];

  constructor(
    private searchService: ElasticService,
    ) {}

  ngOnInit(): void {
    this.search();
  }

  updateAllPricesComplete() {
    this.allPricesComplete =
      this.filters.get('prices')?.get('price1')?.value &&
      this.filters.get('prices')?.get('price5')?.value &&
      this.filters.get('prices')?.get('price10')?.value &&
      this.filters.get('prices')?.get('price50')?.value &&
      this.filters.get('prices')?.get('priceHigh')?.value;
  }

  somePricesComplete(): boolean {
    return (
      (this.filters.get('prices')?.get('price1')?.value ||
        this.filters.get('prices')?.get('price5')?.value ||
        this.filters.get('prices')?.get('price10')?.value ||
        this.filters.get('prices')?.get('price50')?.value ||
        this.filters.get('prices')?.get('priceHigh')?.value) &&
      !this.allPricesComplete
    );
  }

  setAllPrices(completed: boolean) {
    this.allPricesComplete = completed;
    this.filters.get('prices')?.get('price1')?.patchValue(completed);
    this.filters.get('prices')?.get('price5')?.patchValue(completed);
    this.filters.get('prices')?.get('price10')?.patchValue(completed);
    this.filters.get('prices')?.get('price50')?.patchValue(completed);
    this.filters.get('prices')?.get('priceHigh')?.patchValue(completed);
  }

  updateAllCategoriesComplete() {
    this.allPricesComplete =
      this.filters.get('categories')?.get('productosFrescos')?.value &&
      this.filters.get('categories')?.get('conservas')?.value &&
      this.filters.get('categories')?.get('refrescos')?.value &&
      this.filters.get('categories')?.get('farmacia')?.value &&
      this.filters.get('categories')?.get('higiene')?.value &&
      this.filters.get('categories')?.get('limpieza')?.value &&
      this.filters.get('categories')?.get('perfumes')?.value;
  }

  someCategoriesComplete(): boolean {
    return (
      (this.filters.get('categories')?.get('productosFrescos')?.value ||
        this.filters.get('categories')?.get('conservas')?.value ||
        this.filters.get('categories')?.get('refrescos')?.value ||
        this.filters.get('categories')?.get('farmacia')?.value ||
        this.filters.get('categories')?.get('higiene')?.value ||
        this.filters.get('categories')?.get('limpieza')?.value ||
        this.filters.get('categories')?.get('perfumes')?.value) &&
      !this.allCategoriesComplete
    );
  }

  setAllCategories(completed: boolean) {
    this.allCategoriesComplete = completed;
    this.filters.get('categories')?.get('productosFrescos')?.patchValue(completed);
    this.filters.get('categories')?.get('conservas')?.patchValue(completed);
    this.filters.get('categories')?.get('refrescos')?.patchValue(completed);
    this.filters.get('categories')?.get('farmacia')?.patchValue(completed);
    this.filters.get('categories')?.get('higiene')?.patchValue(completed);
    this.filters.get('categories')?.get('limpieza')?.patchValue(completed);
    this.filters.get('categories')?.get('perfumes')?.patchValue(completed);
  }

  private getCategoriesFormValues(): any {
    if (this.filters.get('categories')?.get('priceAll')?.value) {
      return {
        "productosFrescos": true,
        "conservas": true,
        "refrescos": true,
        "farmacia": true,
        "perfumes": true,
        "higiene": true,
        "limpieza": true
      };
    } else {
      return {
        "productosFrescos": this.filters.get('productosFrescos')?.value,
        "conservas": this.filters.get('conservas')?.value,
        "refrescos": this.filters.get('refrescos')?.value,
        "farmacia": this.filters.get('farmacia')?.value,
        "perfumes": this.filters.get('perfumes')?.value,
        "higiene": this.filters.get('higiene')?.value,
        "limpieza": this.filters.get('limpieza')?.value
      };
    }
  }

  private getPricesFormValues(): any {
    if (this.filters.get('prices')?.get('priceAll')?.value) {
      return {
        "price1": true,
        "price5": true,
        "price10": true,
        "price50": true,
        "priceHigh": true,
      };
    } else {
      return {
        "price1": this.filters.get('prices')?.get('price1')?.value,
        "price5": this.filters.get('prices')?.get('price5')?.value,
        "price10": this.filters.get('prices')?.get('price10')?.value,
        "price50": this.filters.get('prices')?.get('price50')?.value,
        "priceHigh": this.filters.get('prices')?.get('priceHigh')?.value,
      };
    }
  }

  search(): void {
    this.searchService.getCarrefourItems(this.searchName, this.getCategoriesFormValues(), this.getPricesFormValues(), this.filters.get('offersAll')?.value, this.sort).pipe(take(1)).subscribe((response: any) => {
      console.log(response)
      this.items = response.hits.hits;
    });
  }

}
