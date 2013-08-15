{
    get_object : function(children) {
        return this.list_view(children,'div','div');
    },

    get_item_attrs : function( idx, total ) {
                        var width = 1200/total;
                        var x = width*idx+100;
                        return 'style="height: 600px; width: '+width+'px; left: '+x+'px; bottom: 100px"';
    }
}

