import scrapy
from scrapy import Request
from scrapy.spiders import Rule, CrawlSpider
from scrapy.linkextractors import LinkExtractor
from crawler.items import Product, PriceDetails
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.remote_connection import LOGGER, logging
from selenium.webdriver.support.ui import WebDriverWait as browserWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

DYNAMIC_CONTENT_LOAD_TIME = 15               # Segundos a esperar para que cargue el contenido dinámico


def printHTML(source_code):
    '''Función auxiliar que muestra por pantalla e identado el HTML recibido'''
    if (type(source_code) is not bytes):
        html = source_code.get_attribute('innerHTML')
    else:
        html = source_code
    soap = BeautifulSoup(html, 'html.parser')
    prettyHTML = soap.prettify()

    print(prettyHTML)


def clear_text(text):
    if (text is not None):
        return str(text).replace('\n', '').strip()


class CarrefourSpider(CrawlSpider):
    name = "carrefour"
    allowed_domains = ["www.carrefour.es"]
    start_urls = ["http://www.carrefour.es"]
    rules = (
        # Obtener los enlaces del mapa web
        Rule(
            LinkExtractor(
                allow = ("mapaweb", )
            ),
            callback = "parse_web_map",
            follow = True,
        ),
        # Continuar parseando cuando haya elementos paginados
        #Rule(
        #    LinkExtractor(
        #        allow = ("offset", )
        #    ),
        #    callback = "extract_data",
        #    follow = True
        #),
    )
    # Categorías a explorar
    desiredCategoriesName = [
        "Productos Frescos",
        "La Despensa",
        "Bebidas",
        "Limpieza y Hogar",
        "Perfumería e Higiene",
        "Parafarmacia",
    ] #
    def __init__(self):
        """Prepara el Spider y una instancia del navegador"""
        super().__init__(self)
        browserOptions = webdriver.ChromeOptions()
        browserOptions.add_argument("--headless")                              # Navegador no abre una nueva ventana
        LOGGER.setLevel(logging.WARNING)                                       # Navegador solo muestra peticiones HTTP que realiza (no muestra cuerpo del mensaje ni cabeceras)
        capabilities = browserOptions.to_capabilities()
        self.browser = webdriver.Chrome(chrome_options=browserOptions)              # Navegador para obtener los enlaces
        self.products_browser = webdriver.Chrome(chrome_options=browserOptions)     # Navegador para obtener los productos


    def __del__(self):
        '''Cierra el navegador al cerrar el Spider'''
        self.products_browser.quit()
        self.browser.quit()

    def parse_web_map(self, response):
        """Escanea el mapa web, abre los desplegables y parsea las categorías"""
        self.browser.get(response.url)                  # Abrir página en navegador

        # Filtrar las categorías deseadas
        for category in self.filter_categories():
            # Obtener las subcategorías de la categoría actual
            for subcategory in self.extract_subcategories(category):
                # Abrir cada subcategoría y obtener sus ramas
                self.click_branch_dropdown(subcategory)
                for branch in self.extract_branches(subcategory):
                    branchName = str(branch.text)
                    if ('Ver todo' in branchName):
                        continue
                    # Obtener link a la página con todos los productos de esta subcategoría
                    link = branch.find_element(By.CLASS_NAME, 'link').get_attribute('href')

                    # Si se consigue un enlace, se sigue. Sino, se vuelve a desplegar la rama
                    if (link is not None):
                        yield Request(link, self.extract_data)
                    else: 
                        self.click_branch_dropdown(branch)
                        for subbranch in branch.find_elements(By.CLASS_NAME, 'category-item__element'):
                            branchName = str(subbranch.text)
                            if ('Ver todo' in branchName):
                                continue

                            element = subbranch.find_element(By.CLASS_NAME, 'link')
                            link = str(element.get_attribute('href'))

                            yield Request(link, self.extract_data)
                            
                            

    def filter_categories(self):
        '''Extrae las categorías deseadas de la página web y las devuelve como código fuente'''
        categoriesVL = self.browser.find_elements(By.CLASS_NAME, 'category-view__list')
        # Filtrar solo las categorías que resultan de interés
        filteredCategoriesVL = list(
            filter(lambda cat:
                cat.find_element(By.CLASS_NAME, "category__title").text in self.desiredCategoriesName,
                categoriesVL
            )
        )

        return filteredCategoriesVL


    def extract_subcategories(self, source_code):
        '''Extrae las subcategorías'''
        subcategories = source_code.find_elements(By.CLASS_NAME, 'category-item')

        return list(subcategories)


    def extract_branches(self, source_code):
        '''Obtiene las ramas de cada subcategoría y las devuelve como código fuente'''
        branches = source_code.find_elements(By.XPATH, './/following-sibling::div')
        
        filteredBranches = list(
            filter(lambda b:
                'Ver todo' not in b.text,
                branches
            )
        )

        return filteredBranches


    def extract_data(self, response):
        # Obtener los datos comunes de los productos de la página actual (categoría, subcategoría y rama)
        categoryName = self.parse_category_name(response)
        subcategoryName = self.parse_subcategory_name(response)
        branchName = self.parse_branch_name(response)

        # Extraer datos de las tarjetas de productos
        data = {
            'category': categoryName,
            'subcategory': subcategoryName,
            'branch': branchName
        }
        products = self.parse_products_from_grid(response, data)
        # Obtener siguiente pagina de resultados paginados
        self.visit_next_results_page(response)

        for product in products:
            yield product

        

    def parse_category_name(self, response):
        # Obtener la barra de navegación de las categorías
        breadcrumbsTag = response.xpath('//ul[contains(@class, "breadcrumb__list")]').get()
        breadcrumbs = BeautifulSoup(str(breadcrumbsTag), 'html.parser')

        # Obtener la categoría activa
        breadcrumb =  breadcrumbs.find_all('li', 'breadcrumb__item', recursive=True)[2]

        return str(breadcrumb.text).strip()


    def parse_subcategory_name(self, response):
        # Obtener la barra de navegación de las categorías
        navbarTag = response.xpath('//div[contains(@class, "horizontal-navigation__first-level")]').get()

        navbar = BeautifulSoup(str(navbarTag), 'html.parser')

        # Obtener la categoría activa
        subcategories = navbar.find_all('div', 'nav-first-level-categories__slide', recursive=True)
        for subcategory in subcategories:
            activeSubcategory = subcategory.find('a', 'active')
            if activeSubcategory is not None:
                name = str(activeSubcategory.text).strip()

                return name


    def parse_branch_name(self, response):
        # Obtener la barra de navegación de las subcategorías
        navbarTag = response.xpath('//div[contains(@class, "horizontal-navigation__second-level")]').get()
        navbar = BeautifulSoup(str(navbarTag), 'html.parser')

        # Obtener la categoría activa
        branches = navbar.find_all('div', 'nav-second-level-categories__slide', recursive=True)
        for branch in branches:
            activeBranch = branch.find('a', 'active')
            if activeBranch is not None:
                name = str(activeBranch.text).strip()

                return name


    def parse_products_from_grid(self, response, parsedData):
        self.products_browser.get(response.url)
        source_code = self.load_dynamic_content_from_page(response.url)            # Scrollear para cargar más productos
        parser = BeautifulSoup(source_code, 'html.parser')

        print('>> PARSEANDO PRODUCTOS DE ' + response.url)
        productCardsList = parser.find_all('div', 'product-card')
        products = []
        for card in productCardsList:
            product = self.parse_product(card, parsedData)
            products.append(product)
        
        return products        



    def parse_product(self, card, parsedData):
        cardContent = BeautifulSoup(str(card), 'html.parser')
        product = Product()

        # Parsear los datos del producto
        imgTag = cardContent.find('img', 'product-card__image', recursive=True)
        imageURL = imgTag['src'] if (imgTag['src'] is not None) else imgTag['data-src']
        nameTag = cardContent.find('h2', 'product-card__title', recursive=True)
        badgeTags = cardContent.find_all('span', 'badge__name', recursive=True)
        badges = list(
            map(lambda item: str(clear_text(item.getText())), badgeTags)
        )
        featureTags = cardContent.find_all('li', 'product-card__info-tag', recursive=True)
        features = list(
            map(lambda item: str(clear_text(item.getText())), featureTags)
        )
        pricesCard = cardContent.find('div', 'product-card__prices-container', recursive=True)
        priceDetails = self.parse_prices(card)

        # Crear el producto (Item) y devolverlo
        product['category'] = parsedData['category']
        product['subcategory'] = parsedData['subcategory']
        product['branch'] = parsedData['branch']
        product['name'] = clear_text(nameTag.getText())
        product['pictureURL'] = imageURL
        product['shop'] = 'Carrefour'
        product['badges'] = badges
        product['features'] = features
        product['prices'] = dict(priceDetails)

        # print('>> Parseado producto: ' + product['name'])
        return product



    def parse_prices(self, pricesContainer):
        '''Calcula los precios del producto actual y los devuelve'''
        # Obtener el precio de venta actual
        totalPrice = pricesContainer.find('span', 'product-card__price', recursive=True)
        hasDiscount = (totalPrice is None)          # Hay descuento si no se encuentra el precio por su etiqueta HTML original
        price = dict()
       
        if (hasDiscount):                           # Si no se encuentra el precio, es que el producto tiene un precio distinto.
            totalPrice = pricesContainer.find('span', 'product-card__price--current', recursive=True).getText()
            unitPrice = pricesContainer.find('span', 'product-card__price-per-unit', recursive=True).getText()
            priceBefore = pricesContainer.find('span', 'product-card__price--strikethrough', recursive=True).getText()
        else:                                       # Si se encuentra el precio, el producto no tiene descuentos
            totalPrice = totalPrice.getText()
            unitPrice = pricesContainer.find('span', 'product-card__price-per-unit', recursive=True).getText()
            priceBefore = None

        # Asignar valores a los precios
        price['totalPrice'] = clear_text(totalPrice)
        price['unitPrice'] = clear_text(unitPrice)
        price['priceBefore'] = clear_text(priceBefore)
        price['hasDiscount'] = hasDiscount

        return PriceDetails(price)


    ############### Eventos del navegador ###############

    def click_branch_dropdown(self, source_code):
        '''Hace click en las ramas para ver sus elementos'''
        dropdown = source_code.find_element(By.CLASS_NAME, 'link')
        dropdown.click()


    def load_dynamic_content_from_page(self, page_url):
        '''Hace scroll hasta el último item de la página para cargar el contenido dinámico y devuelve el contenido de la página'''
        # https://scrapfly.io/blog/web-scraping-with-selenium-and-python/
        scroll_to_last_item_script = """
            window.scrollTo(0, document.body.scrollHeight);
            let productCards = document.querySelectorAll(".product-card-list__item");
            let lastCard = productCards[productCards.length - 1];
            lastCard.scrollIntoView();
        """
        self.products_browser.execute_script(scroll_to_last_item_script)

        # Espera a que se carge el contenido dinámico
        try:
            # self.products_browser.implicitly_wait(DYNAMIC_CONTENT_LOAD_TIME)
            browserWait(self.products_browser, DYNAMIC_CONTENT_LOAD_TIME).until(
                # Espera hasta que no exista ninguna tarjeta que tenga tenga una imagen cargando
                EC.visibility_of_element_located(
                    (By.XPATH, '//img[ @class="product-card__image" and contains(@lazy, "loaded") ]')
                )
            )
        except TimeoutException:
            print('Error al cargar dinámicamente los elementos de ' + str(page_url))
        finally:
            return self.products_browser.page_source


    def visit_next_results_page(self, response):
        '''Hace click en el botón para ir a la siguiente página de resultados, si existe'''
        parser = BeautifulSoup(response.body, 'html.parser')
        
        # Busca el contenedor con los botones para cambiar de página
        paginationContainer = parser.find('div', 'pagination_container', recursive=True)
        if (paginationContainer is not None):
            # Botón de Anterior y Siguiente son ambos <a>, pero Siguiente es el último de la lista
            nextPageButton = list(paginationContainer.find_all('a', '', recursive=True))[-1]
            nextPageLink = nextPageButton['href']

            print('>> Visitando siguiente página ' + str(nextPageLink))
            yield Request(nextPageLink, callback = self.extract_data)

