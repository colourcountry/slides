{
    get_object : function(children) {
        return this.list_view(children,'div','div');
    },

    get_item_attrs : function( idx, total ) {
                    if ( idx==total-1 && idx>3 ) {
                        var x = 400;
                        var y = 440;
                    } else {
                        var x = 400-Math.cos(idx*1.4+0.3)*400;
                        var y = 400-Math.sin(idx*1.4+0.3)*300;
                    }
                    return 'style="left: '+x+'px; bottom: '+y+'px"';
    }
}

