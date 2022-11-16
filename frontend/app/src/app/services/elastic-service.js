const { Client } = require('elasticsearch');
const client = new Client({ host: 'localhost:9200' });

export async function getCarrefourItem(
  name = undefined,
  category = undefined,
  subcategory = undefined,
  branch = undefined,
  pictureURL = undefined,
  shop = undefined,
  badges = undefined,
  prices = undefined
) {
  const body = {
    _source: ['price', 'category', 'hasDiscount'],
    size: 100,
    query: {
      bool: {
        must: [
          {
            nested: {
              path: 'carrefour',
              query: {
                bool: {
                  must: [],
                },
              },
              inner_hits: {
                _source: [
                  'carrefour.category',
                  'carrefour.subcategory',
                  'carrefour.branch',
                  'carrefour.pictureURL',
                  'carrefour.shop',
                  'carrefour.badges',
                  'carrefour.prices',
                ],
                size: 100,
                sort: [
                  {
                    'carrefour.price': {
                      order: 'desc',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };

  if (price !== undefined) {
    body.query.bool.must.push({
      match: { price: { query: price, fuzziness: 2 } },
    });
  }

  if (category != undefined) {
    category.map((type) =>
      body.query.bool.must.push({
        match: { 'category.name': category },
      })
    );
  }

  if (subcategory != undefined) {
    subcategory.map((type) =>
      body.query.bool.must.push({
        match: { 'subcategory.name': subcategory },
      })
    );
  }

  if (hasDiscount !== undefined) {
    body.query.bool.must.push({ match: { hasDiscount: hasDiscount } });
  }

  if (carrefour !== undefined) {
    body.query.bool.must.push({ match: { carrefour: carrefour } });
  }

  if (branch !== undefined) {
    body.query.bool.must[0].nested.query.bool.must.push({
      range: { 'carrefour.branch': { gte: branch } },
    });
  }

  if (pictureURL !== undefined) {
    body.query.bool.must[0].nested.query.bool.must.push({
      range: { 'carrefour.pictureURL': { gte: pictureURL } },
    });
  }

  if (shop !== undefined) {
    body.query.bool.must[0].nested.query.bool.must.push({
      range: { 'carrefour.shop': { gte: shop } },
    });
  }

  if (badges !== undefined) {
    body.query.bool.must[0].nested.query.bool.must.push({
      range: { 'carrefour.badges': { gte: badges } },
    });
  }

  if (prices !== undefined) {
    body.query.bool.must[0].nested.query.bool.must.push({
      range: { 'carrefour.prices': { gte: prices } },
    });
  }

  const res = await client.search({
    index: 'carrefour',
    body: body,
  });

  return res;
}

export function mergeHits(res) {
  return res.hits.hits.map((hits) => {
    const carrefour = hits._source;
    carrefour['items'] = hits.inner_hits.carrefour.hits.hits.map(
      (inner_hit) => {
        return inner_hit._source;
      }
    );
    return carrefour;
  });
}

export function mergeInnerHits(res) {
  return res.hits.hits
    .map((hits) => {
      return hits.inner_hits.carrefour.hits.hits.map((inner_hit) => {
        return Object.assign({}, hits._source, inner_hit._source);
      });
    })
    .flat();
}
