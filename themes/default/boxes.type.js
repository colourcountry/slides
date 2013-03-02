x.prototype.get_object = function(children) {
    return this.list_view(children,'div','div');
};

x.prototype.get_item_attrs = function( idx, total ) {
                    var width = 700/total;
                    var x = width*idx+50;
                    return 'style="height: 300px; width: '+width+'px; left: '+x+'px; bottom: 50px"';
};

