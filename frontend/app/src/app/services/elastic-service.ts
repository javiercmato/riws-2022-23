import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ElasticService {
  constructor(private httpClient: HttpClient) {}

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
    hasDiscount: boolean
  ): any {
    const body = {
      _source: ['price', 'category', 'hasDiscount'],
      size: 100,
      query: {
        bool: {
          must: [
            {
              match: {
                name: name !== undefined ? name : '',
              },
            },
            // {
            //   nested: {
            //     path: 'carrefour',
            //     query: {
            //       bool: {
            //         must: [],
            //       },
            //     },
            //     inner_hits: {
            //       _source: [
            //         'carrefour.category',
            //         'carrefour.subcategory',
            //         'carrefour.branch',
            //         'carrefour.pictureURL',
            //         'carrefour.shop',
            //         'carrefour.badges',
            //         'carrefour.prices',
            //       ],
            //       size: 100,
            //       sort: [
            //         {
            //           'carrefour.price': {
            //             order: 'desc',
            //           },
            //         },
            //       ],
            //     },
            //   },
            // },
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
        if (categoryCriteria[1]){

        matchObject.term.category = categoryCriteria[0];
        body.query.bool.must.push(matchObject);
      }

      });
    }
    // if (prices != undefined) {

    //   Object.entries(prices).forEach( (price) =>
    //     body.query.bool.must.push({
    //       match: { price[0]: price[1] },
    //     })
    //   );
    // };

    // if (hasDiscount !== undefined) {
    //   body.query.bool.must.push({ match: { hasDiscount: hasDiscount } });
    // }

    // if (carrefour !== undefined) {
    //   body.query.bool.must.push({ match: { carrefour: carrefour } });
    // }

    // if (branch !== undefined) {
    //   body.query.bool.must[0].nested.query.bool.must.push({
    //     range: { 'carrefour.branch': { gte: branch } },
    //   });
    // }

    // if (pictureURL !== undefined) {
    //   body.query.bool.must[0].nested.query.bool.must.push({
    //     range: { 'carrefour.pictureURL': { gte: pictureURL } },
    //   });
    // }

    // if (shop !== undefined) {
    //   body.query.bool.must[0].nested.query.bool.must.push({
    //     range: { 'carrefour.shop': { gte: shop } },
    //   });
    // }

    // if (badges !== undefined) {
    //   body.query.bool.must[0].nested.query.bool.must.push({
    //     range: { 'carrefour.badges': { gte: badges } },
    //   });
    // }

    // if (prices !== undefined) {
    //   body.query.bool.must[0].nested.query.bool.must.push({
    //     range: { 'carrefour.prices': { gte: prices } },
    //   });
    // }

    const res = this.httpClient.post(
      'url del elastic, definir como constante en algún lado',
      {
        index: 'products',
        body: body,
      }
    );

    return res;
  }

  // productosFrescos: boolean;
  // conservas: boolean;
  // refrescos: boolean;
  // farmacia: boolean;
  // perfumes: boolean;
  // higiene: boolean;
  // limpieza: boolean;
  
  // private mergeHits(res) {
  //   return res.hits.hits.map((hits) => {
  //     const carrefour = hits._source;
  //     carrefour['items'] = hits.inner_hits.carrefour.hits.hits.map(
  //       (inner_hit) => {
  //         return inner_hit._source;
  //       }
  //     );
  //     return carrefour;
  //   });
  // }

  // private mergeInnerHits(res) {
  //   return res.hits.hits
  //     .map((hits) => {
  //       return hits.inner_hits.carrefour.hits.hits.map((inner_hit) => {
  //         return Object.assign({}, hits._source, inner_hit._source);
  //       });
  //     })
  //     .flat();
  // }
  private assignRangeFromPriceCriteria(priceCriteria: [string, boolean]): any {
    // "price1": true,
    // "price5": true,
    // "price10": true,
    // "price50": true,
    // "priceHigh": true,

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
  }
}
