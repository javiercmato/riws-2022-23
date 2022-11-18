import os
import asyncio
import json
from base64 import b64encode
import requests

import constants

from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from crawler.spiders.carrefour import CarrefourSpider

from elasticsearch import Elasticsearch
from elasticsearch.helpers import streaming_bulk


def load_or_crawl_results():
    '''Carga los datos para almacenar en Elastic.
    Si no existen, pide a Scrapy que los obtenga'''
    # Comprobar si están indexados los datos
    elasticIndexedDataFile = os.path.join(constants.RESULTS_DIRECTORY_NAME, constants.ELASTICSEARCH_INDEX_FILE)
    if (not os.path.exists(elasticIndexedDataFile)):
        # Pedir a Scrapy que busque los datos
        crawl_results()

    # Leer los datos indexados
    with open(elasticIndexedDataFile, 'r') as elastic_data:
        return json.loads(elastic_data.read())


def picture_to_Base64(pictureURL):
    '''Descarga la foto de la URL recibida y la convierte a Base64'''
    data = requests.get(pictureURL).content
    encodedData = b64encode(data)

    return str(encodedData)[2:-1]


def process_results():
    '''Adaptar los datos para almacenarlos en Elastic'''
    # Leer los datos obtenidos
    carrefourResults = os.path.join(constants.RESULTS_DIRECTORY_NAME, constants.CARREFOUR_PRODUCTS_FILE)
    with open(carrefourResults, 'r') as carrefour_data:
        products = json.loads(carrefour_data.read())
        for product in products:
            product['pictureURL'] = picture_to_Base64(product['pictureURL'])
    
    # Guarda los datos para indexarlos en Elastic
    elasticIndexedDataFile = os.path.join(constants.RESULTS_DIRECTORY_NAME, constants.ELASTICSEARCH_INDEX_FILE)
    with open(elasticIndexedDataFile, 'w') as elastic_data:
        jsonData = json.dumps(products, indent = 4)
        elastic_data.write(jsonData)


def crawl_results():
    '''Realiza el proceso de crawleo de los datos con Scrapy'''
    spiders = [
        CarrefourSpider,
    ]
    crawlerSettings = get_project_settings()
    crawlProcess = CrawlerProcess(crawlerSettings)
    for spider in spiders:
        crawlProcess.crawl(spider)
    print('## Comenzando proceso de crawling...')
    crawlProcess.start()

    # Procesar resultados obtenidos
    process_results()


def create_elastic_index(client: Elasticsearch):
    '''Crea un índice en ElasticSearch para guardar los elementos recuperados'''
    # Si el índice ya existía, se borra para crear uno nuevo y limpio
    client.indices.delete(index=constants.ELASTICSEARCH_INDEX_NAME)

    print(f'## Creando el índice \'{constants.ELASTICSEARCH_INDEX_NAME}\' en ElasticSearch...')
    client.indices.create(index=constants.ELASTICSEARCH_INDEX_NAME)
    client.indices.put_mapping(index=constants.ELASTICSEARCH_INDEX_NAME,
        properties={
            'category': {'type': 'text'},
            'subcategory': {'type': 'text'},
            'branch': {'type': 'text'},
            'name': {'type': 'text'},
            'pictureURL': {'type': 'text', 'index': 'false'},
            'shop': {'type': 'text'},
            'badges': {'type': 'text'},
            'features': {'type': 'text'},
            'prices': {'properties': {
                'totalPrice': 'text',
                'unitPrice': 'text',
                'priceBefore': 'text',
                'hasDiscount': 'boolean'
            }},
        }, 
    )


def actions_generator(products):
    '''Itera sobre los elementos a guardar en Elastic'''
    for product in products:
        document = {
            'category': product['category'],
            'subcategory': product['subcategory'],
            'branch': product['branch'],
            'name': product['name'],
            'pictureURL': product['pictureURL'],
            'shop': product['shop'],
            'badges': product['badges'],
            'features': product['features'],
            'prices': product['prices']
        }

        yield document


async def index_products(products, client):
    '''Introduce los productos en Elastic'''
    print('## Indexando datos en Elastic...')
    indexed_products = sum(indexed for (indexed, _) in streaming_bulk(
            client=client,
            index=constants.ELASTICSEARCH_INDEX_NAME,
            actions=actions_generator(products)
        )
    )

    percentage_products_indexed = float( 100 * (index_products / len(products)))
    print(f'## Se han indexado {indexed_products} de {len(products)} : ({percentage_products_indexed}) %')




# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
async def main():
    # Obtener los datos
    products = load_or_crawl_results()

    # Crear indice en Elastic para guardar los datos
    elasticClient = Elasticsearch(
        "https://localhost:9200",
        basic_auth=(constants.ELASTICSEARCH_USER, constants.ELASTICSEARCH_PASSWORD),
        verify_certs=False
    )
    create_elastic_index(elasticClient)

    # Guardar productos en Elastic
    await index_products(products, elasticClient)
    


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
