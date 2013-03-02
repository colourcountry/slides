x.prototype.get_object = function(children) {
    var ne = '';
    var nw = '';
    var se = '';
    var sw = '';
    var leftovers = '';
    for (var i=0; i<children.length; i++) {
        if (typeof children[i].s != 'undefined') {
            console.debug(children[i].s);
            if (children[i].t.grid_position == 'ne') { ne += '<p>'+children[i].t.value()+'</p>' } else
            if (children[i].t.grid_position == 'nw') { nw += '<p>'+children[i].t.value()+'</p>' } else
            if (children[i].t.grid_position == 'se') { se += '<p>'+children[i].t.value()+'</p>' } else
            if (children[i].t.grid_position == 'sw') { sw += '<p>'+children[i].t.value()+'</p>' }
            else { leftovers += '<p>'+children[i].t.value()+'</p>' }                
        }
    }
    return '<table class="grid"><tr><td>'+nw+'</td><td>'+ne+'</td></tr><tr><td>'+sw+'</td><td>'+se+'</td></tr></table>';
};
