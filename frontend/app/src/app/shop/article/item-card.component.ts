import { Component, Input, OnInit } from '@angular/core';
import { Item } from '../types';

@Component({
  selector: 'app-item-card',
  templateUrl: './item-card.component.html'
})
export class ItemCardComponent implements OnInit {

  @Input()
  item!: Item;

  constructor() { }

  ngOnInit(): void {
  }

}
