x.prototype.slide_view = function(children) {
    return this.list_view(children,'div','div','class="incremental"', function( idx, total ) {
                    var width = 700/total;
                    var x = width*idx+50;
                    return 'style="height: 300px; width: '+width+'px; left: '+x+'px; bottom: 50px"';
    });
};
