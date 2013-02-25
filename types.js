Ty = function(pr, defn){ this.defn = defn; this.pr = pr };

Ty.prototype.HTML_UNSAFE = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;', '\\n': '\n' };

Ty.prototype.html = function(text) {
    return text.replace(/[\"&<>]|\\n/g, function (a) { return this.HTML_UNSAFE[a]; }.bind(this));
};

Ty.prototype.get_href = function(id) {
    return '#'+id+'.0';
};

Ty.prototype.object_view = function(children, object_fn) {
    var c_lass = '';
    if (typeof this.defn.s != 'undefined') {
        c_lass = 'class="'+this.html(this.defn.s)+'"';
    }

    var section_attrs = '';
    var section_head = '<div class="section-head"><h1>'+this.html(this.defn.n)+'</h1>';
    var section_foot = '';
    for (var i=0; i<children.length; i++) {
        if (typeof children[i].t.section_attrs != 'undefined') { section_attrs += ' '+children[i].t.section_attrs(this.defn); }
        if (typeof children[i].t.section_head != 'undefined') { section_head += children[i].t.section_head(this.defn); }
        if (typeof children[i].t.section_foot != 'undefined') { section_foot += children[i].t.section_foot(this.defn); }
    }

    section_head += '</div>';
    if (section_foot) {
        section_foot = '<div class="section-foot">'+section_foot+'</div>'
    }

    return '<section '+c_lass+' id="s'+this.defn.id+'"'+section_attrs+'>'+section_head+object_fn(children, this.defn)+section_foot+'</section>';
}

Ty.prototype.list_view = function(children, container,item,container_attrs,item_attr_fn) {

    if (typeof container_attrs == 'undefined' || container_attrs == '') {
        container_attrs = '';
    }

    if (typeof item == 'undefined' || item == '') {
        cl_item = '';
        item = '';
    } else {
        cl_item = '</'+item+'>';
    }

    if (typeof container == 'undefined' || container == '') {
        cl_container = '';
        container = '';
    } else {
        cl_container = '</'+container+'>';
    }

    return this.object_view( children, function(children, parent) {
        var items = [];
        for (var i=0; i<children.length; i++) {
            if (typeof children[i].t.child_view != 'undefined' && typeof children[i].t.suppress_child == 'undefined') {
                items.push(children[i].t.child_view(parent));
            }
        }

        var response = '<'+container+' '+container_attrs+'>';
        for (var i=0; i<items.length; i++) {
            if (typeof item_attr_fn != 'undefined') {
                var item_attrs = item_attr_fn( i, items.length );
            } else {
                var item_attrs = '';
            }
            response += '<'+item+' '+item_attrs+'>'+items[i]+cl_item;
        }
        response += cl_container;
        return response;
   });
}
