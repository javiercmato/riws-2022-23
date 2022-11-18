import os
from pathlib import Path
import json

import constants


class ProductToJSONPipeline:

    def open_spider(self, spider):
        '''Crea una lista con los productos extraídos'''
        self.carrefour_products = []

    
    def process_item(self, item, spider):
        '''Añade el item a la lista de productos'''
        self.carrefour_products.append(dict(item))


    def close_spider(self, spider):
        '''Escribir los productos en fichero JSON'''
        # Obtener la ruta a la carpeta que guada los resultados
        currentPath = os.path.realpath(__file__)
        currentPathName = os.path.dirname(currentPath)
        parentDirectory = Path(currentPathName).parent.absolute()
        resultsDirectory = parentDirectory.joinpath(constants.RESULTS_DIRECTORY_NAME)

        # Crear la carpeta de resultados si no existe
        if (not os.path.exists(resultsDirectory)):
            os.mkdir(resultsDirectory)

        # Convertir los elementos obtenidos a JSON
        jsonData = json.dumps(self.carrefour_products, indent=4)

        # Guardar los JSON en sus ficheros
        carrefour_file_path = os.path.join(resultsDirectory, constants.CARREFOUR_PRODUCTS_FILE)
        try:
            # Intenta escribir en el fichero
            carrefour_file = open(carrefour_file_path, 'w')
        except FileNotFoundError:
            # Crea el fichero
            os.open(carrefour_file_path, 'x')
        finally:
            carrefour_file.write(jsonData)
            carrefour_file.close()

        print(f'\nEXTRAÍDOS {len(self.carrefour_products)} PRODUCTOS DE CARREFOUR \n')

