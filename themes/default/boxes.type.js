x.prototype.get_object = function(children) {
    return this.list_view(children,'div','div');
};

x.prototype.get_item_attrs = function( idx, total ) {
                    var width = 1400/total;
                    var x = width*idx+100;
                    return 'style="height: 600px; width: '+width+'px; left: '+x+'px; bottom: 100px"';
};

