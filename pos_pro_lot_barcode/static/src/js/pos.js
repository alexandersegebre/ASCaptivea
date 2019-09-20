odoo.define('pos_pro_lot_barcode', function(require){
    
var models = require('point_of_sale.models');
var core = require('web.core');
var gui = require('point_of_sale.gui');
var screens = require('point_of_sale.screens');
var _t = core._t;

    models.load_models([{
        model: 'stock.production.lot',
        fields: ['name', 'ref', 'product_id', 'product_uom_id', 'create_date', 'barcode','wv_location_id'],
        // domain: function(self){return [['wv_location_id','=',self.config.stock_location_id[0]]]},
        loaded: function (self, lots) {
            self.lots = lots;
            self.lot_by_name = {};
            self.lot_by_barcode = {};
            self.lot_by_id = {};
            for (var i = 0; i < lots.length; i++) {
                var lot = lots[i];
                self.lot_by_name[lot['name']] = lot;
                self.lot_by_id[lot['id']] = lot;
                if (lot['barcode']) {
                    if (self.lot_by_barcode[lot['barcode']]) {
                        self.lot_by_barcode[lot['barcode']].push(lot)
                    } else {
                        self.lot_by_barcode[lot['barcode']] = [lot]
                    }
                }
            }
        }
    }]);
    var SetSaleReturnButton = screens.ActionButtonWidget.extend({
        template: 'SetSaleReturnButton',
            init: function (parent, options) {
                this._super(parent, options);
                this.pos.get('orders').bind('add remove change', function () {
                    this.renderElement();
                }, this);
                this.pos.bind('change:selectedOrder', function () {
                    this.renderElement();
                }, this);
            },
        button_click: function () {
            var self = this;
            var order = self.pos.get_order();
            if(order.transfer_st){
                order.transfer_st = false;
            }
            else{
                order.transfer_st = true;
            }
            this.renderElement();
        },
        get_current_pricelist_name: function () {
            var name = _t("Sale Mode")
            var i = 0;
            var order = this.pos.get_order();
            if(order){
                if (order.transfer_st) {
                    name = _t("Return Mode");
                    i = 1;

                }
            }
            return [name,i];
        },
    });

    screens.define_action_button({
        'name': 'sale_return_button',
        'widget': SetSaleReturnButton,
        'condition': function(){
            return true;
        },
    });
    var _super_PosModel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        scan_product: function (parsed_code){
            var self = this;
            var product = this.db.get_product_by_barcode(parsed_code.base_code);
            var lots = this.lot_by_barcode[parsed_code.base_code];
            var order = this.get_order();
            var lots = _.filter(lots, function (lot) {
                var product = self.db.product_by_id[lot.product_id[0]];
                return product != undefined
            });
            if(lots && lots.length){
                if(lots.length == 1){
                    var lot = lots[0];
                    var product = self.db.product_by_id[lot.product_id[0]];
                    if (product){
                        order.add_product(product, {merge: false});
                        var order_line = order.get_selected_orderline();
                        if(order_line){
                            $('.packlot-line-input').remove();
                            setTimeout(function () {
                                var pack_models = order_line.pack_lot_lines.models;
                                if (pack_models) {
                                    for (var i = 0; i < pack_models.length; i++) {
                                        pack_models[i].set_lot(lot);
                                        pack_models[i].set_lot_name(lot['name']);
                                    }                                   
                                    order_line.trigger('change', order_line);
                                }
                            }, 299);
                        }
                        self.gui.close_popup();
                        return true
                    } else {
                        alert("Lot product not found.");
                    }
                }
                else if (lots.length > 1) {
                    var list = [];
                    for (var i = 0; i < lots.length; i++) {
                        list.push({
                            'label': lots[i]['name'],
                            'item': lots[i]
                        })
                    }
                    this.gui.show_popup('selection', {
                        title: _t('Select Lot'),
                        list: list,
                        confirm: function (lot) {
                            var product = self.db.product_by_id[lot.product_id[0]];
                            if(product) {
                                order.add_product(product, {merge: false});
                                var order_line = order.get_selected_orderline();
                                if(order_line){
                                    $('.packlot-line-input').remove();
                                    setTimeout(function () {
                                        var pack_models = order_line.pack_lot_lines.models;
                                        if (pack_models) {
                                            for (var i = 0; i < pack_models.length; i++) {
                                                pack_models[i].set_lot_name(lot['name']);
                                                pack_models[i].set_lot(lot);
                                            }
                                            order_line.trigger('change', order_line);
                                        }
                                    }, 299);
                                }
                                self.gui.close_popup();
                                return true
                            } else {
                                alert("Lot product not found.");
                            }
                        }
                    });
                    return true; 
                }
            }
            return _super_PosModel.scan_product.apply(this, arguments);
        },
    });

    var _super_orderline_line = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            _super_orderline_line.initialize.apply(this, arguments);
            if(this.order.transfer_st){
               this.set_quantity(-1);
            }
            else{
                this.set_quantity(1);
            }
        }
    });

    var _super_Packlotline = models.Packlotline.prototype;
    models.Packlotline = models.Packlotline.extend({
        set_lot: function (lot) {
            this.set({lot: lot || null});
        },
        export_as_JSON: function () {
            var json = _super_Packlotline.export_as_JSON.apply(this, arguments);
            if (this.lot) {
                json['lot_id'] = this.lot.id
            }
            return json
        },
        init_from_JSON: function (json) {
            var res = _super_Packlotline.init_from_JSON.apply(this, arguments);
            if (json.lot_id) {
                var lot = this.pos.lot_by_id[json.lot_id];
                if (lot) {
                    this.set_lot(lot)
                }
            }
            return res;
        },
    })
});
