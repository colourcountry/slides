x.prototype.get_object = function(children) {
    return this.list_view(children,'div','div');
};

x.prototype.get_item_attrs = function( idx, total ) {
                    if ( idx==total-1 && idx>3 ) {
                        var x = 250;
                        var y = 220;
                    } else {
                        var x = 250-Math.cos(idx*1.4+0.3)*200;
                        var y = 200-Math.sin(idx*1.4+0.3)*150;
                    }
                    return 'style="left: '+x+'px; bottom: '+y+'px"';
};
