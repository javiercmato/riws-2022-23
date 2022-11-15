# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

from scrapy.item import Item, Field


class PriceDetails(Item):
    '''Detalles del precio de un Product'''
    unitPrice = Field()         # Precio de una unidad (p. ej.: ¢/kg, €/Litro o €/unidad) -- (String)
    hasDiscount = Field()       # Indica si tiene algún tipo de oferta aplicada al precio final -- (Bool)
    priceBefore = Field()       # Precio anterior (si tiene algún tipo de oferta, sino es null) -- (String || null)
    totalPrice = Field()        # Precio total del producto que el cliente pagará al pasar por caja -- (String)
    

class Product(Item):
    '''Información de un producto recuperado de un supermercado'''
    name = Field()              # Nombre del producto -- (String)
    category = Field()          # Categoría del producto (p. ej.: "Bebidas") -- (String)
    subcategory = Field()       # Subcategoría del producto (p. ej.: "Cerveza") -- (String)
    branch = Field()            # Rama a la que pertenece el producto (p. ej.: "Artesana" o "Sin Alcohol") -- (String)
    pictureURL = Field()        # URL a la foto del producto -- (String)
    shop = Field()              # Supermercado al que pertenece el producto -- (String)
    badges = Field()            # Array con avisos sobre el producto (p. ej.: "3 por el precio de 2") -- (String[])
    features = Field()          # Array con propiedades del producto: ["sin gluten", "sin azúcares añadidos", ...] -- (String[])
    prices = Field()            # Objeto con precios asociados al producto -- (PriceDetails)


