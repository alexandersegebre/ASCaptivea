# -*- coding: utf-8 -*-

{
    'name': 'Pos Product Lot Barcode',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'author': 'Webveer',
    'summary': 'Allows you to scan product lot/serial barcode in Pos Interface.',
    'description': "Allows you to scan product lot/serial barcode in Pos Interface.",
    'depends': ['stock','point_of_sale'],
    'data': [
        'views/views.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'images': [
        'static/description/scan.jpg',
    ],
    'installable': True,
    'website': '',
    'auto_install': False,
    'price': 130,
    'currency': 'EUR',
}
