import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ElasticService {
  constructor(private httpClient: HttpClient) { }

  private elasticAuthHeader: string = "Basic " + btoa("elastic:riws")
  private httpOptions = {
    headers: new HttpHeaders({
      Authorization: this.elasticAuthHeader,
    })
  }

  getCarrefourItems(
    name: string,
    categories: {
      productosFrescos: boolean;
      conservas: boolean;
      refrescos: boolean;
      farmacia: boolean;
      perfumes: boolean;
      higiene: boolean;
      limpieza: boolean;
    },
    prices: {
      price1: boolean;
      price5: boolean;
      price10: boolean;
      price50: boolean;
      priceHigh: boolean;
    },
    hasDiscount: boolean,
    sort: string
  ): any {
    const body = {
      size: 100,
      sort: [
        // Se pone por defecto que ordene por el precio de forma ascendente
        {
          'prices.totalPrice': {
            order: sort === undefined ? 'asc' : sort,
          },
        },
      ],
      query: {
        bool: {
          must: [
            {
              match: { name: { query: name === undefined ? '' : name, fuzziness: 2 } },
            },
          ],
        },
      },
    };
    //   {
    //     "category": "Bebidas",
    //     "subcategory": "Refrescos",
    //     "branch": "Colas",
    //     "name": "Coca Cola zero az\u00facar zero cafe\u00edna pack 24 latas 33 cl.",
    //     "pictureURL": "https://static.carrefour.es/hd_350x_/img_pim_food/303653_00_1.jpg",
    //     "shop": "Carrefour",
    //     "badges": [],
    //     "features": [],
    //     "prices": {
    //         "totalPrice": "18,24 \u20ac",
    //         "unitPrice": "2,30 \u20ac/l",
    //         "priceBefore": null,
    //         "hasDiscount": false
    //     }
    // }

    if (prices !== undefined) {
      //Object.entries(objeto) devuelve un array de tuplas [propiedad, valor], donde propiedad es el nombre de la misma y valor, su valor (en este caso, booleanos)
      Object.entries(prices).forEach((priceCriteria) => {
        let matchObject: any = {};
        matchObject.range = this.assignRangeFromPriceCriteria(priceCriteria);

        body.query.bool.must.push(matchObject);
      });
    }

    if (categories !== undefined) {
      //Object.entries(objeto) devuelve un array de tuplas [propiedad, valor], donde propiedad es el nombre de la misma y valor, su valor (en este caso, booleanos)
      Object.entries(categories).forEach((categoryCriteria) => {
        let matchObject: any = {};
        if (categoryCriteria[1]) {
          matchObject.term.category = categoryCriteria[0];
          body.query.bool.must.push(matchObject);
        }
      });
    }

    console.log(
      JSON.stringify({
        index: 'products',
        body: body,
      })
    );

    console.log({
      index: 'products',
      body: body,
    });

    return this.httpClient.post(
      'https://localhost:9200/products/_search',
      {
        index: 'products',
        body: body,
      },
      this.httpOptions
    );
  }

  private assignRangeFromPriceCriteria(priceCriteria: [string, boolean]): any {

    let rangeCondition: any = {};

    switch (priceCriteria[0]) {
      case 'price1': {
        if (priceCriteria[1])
          rangeCondition = {
            'prices.totalPrice': { gte: 0, lte: 1 },
          };
        break;
      }
      case 'price5': {
        if (priceCriteria[1])
          rangeCondition = {
            'prices.totalPrice': { gte: 1, lte: 5 },
          };
        break;
      }
      case 'price10': {
        if (priceCriteria[1])
          rangeCondition = {
            'prices.totalPrice': { gte: 5, lte: 10 },
          };
        break;
      }
      case 'price50': {
        if (priceCriteria[1])
          rangeCondition = {
            'prices.totalPrice': { gte: 10, lte: 50 },
          };
        break;
      }
      case 'priceHigh': {
        if (priceCriteria[1])
          rangeCondition = {
            'prices.totalPrice': { gte: 50 },
          };
        break;
      }
      default: {
        rangeCondition = {
          'prices.totalPrice': { gte: 0 },
        };
      }
    }

    return rangeCondition;
  }
}
