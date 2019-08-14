# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from datetime import datetime, timedelta

class stock_production_lot(models.Model):
    _inherit = 'stock.production.lot'

    barcode = fields.Char('Barcode')
    wv_location_id = fields.Many2one(compute='_get_wv_location_id', comodel_name='stock.location', string='Location Id',store=True)
 
    @api.multi  
    def _get_wv_location_id(self):
        for record in self:
            quant_id = self.env['stock.quant'].search([('lot_id','=',record.id)])
            for rec in quant_id:
                record.wv_location_id = rec.location_id.id
 
    @api.model
    def create(self, vals):
        lot = super(stock_production_lot, self).create(vals)
        if not lot.barcode:
            format_code = "%s%s%s" % (11,datetime.now().strftime("%d%m%y%H%M"),lot.id)
            code = self.env['barcode.nomenclature'].sanitize_ean(format_code)
            lot.write({'barcode': code})
        return lot

    @api.multi
    def update_ean(self, vals):
        for lot in self:
            format_code = "%s%s%s" % (11,datetime.now().strftime("%d%m%y%H%M"),lot.id)
            code = self.env['barcode.nomenclature'].sanitize_ean(format_code)
            lot.write({'barcode': code})
        return True
