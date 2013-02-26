Ty = function(pr, defn){ this.defn = defn; this.pr = pr; this.c_lass = ''; };

Ty.prototype.HTML_UNSAFE = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;', '\\n': '\n' };

Ty.prototype.html = function(text) {
    return text.replace(/[\"&<>]|\\n/g, function (a) { return this.HTML_UNSAFE[a]; }.bind(this));
};

Ty.prototype.get_href = function(id) {
    return '#'+id+'.0';
};

Ty.prototype.object_view = function(children, object_fn) {

    var section_attrs = '';
    var section_head = '<div class="_section-head"><h1>'+this.html(this.defn.n)+'</h1>';
    var section_before = '';
    var section_left = '';
    var section_after = '';
    var section_right = '';
    var section_foot = '';
    for (var i=0; i<children.length; i++) {
        if (typeof children[i].t.section_attrs != 'undefined') { section_attrs += ' '+children[i].t.section_attrs(this.defn); }
        if (typeof children[i].t.section_head != 'undefined') { section_head += children[i].t.section_head(this.defn); }
        if (typeof children[i].t.section_before != 'undefined') { section_before += children[i].t.section_before(this.defn); }
        if (typeof children[i].t.section_left != 'undefined') { section_left += children[i].t.section_left(this.defn); }
        if (typeof children[i].t.section_after != 'undefined') { section_after += children[i].t.section_after(this.defn); }
        if (typeof children[i].t.section_right != 'undefined') { section_right += children[i].t.section_right(this.defn); }
        if (typeof children[i].t.section_foot != 'undefined') { section_foot += children[i].t.section_foot(this.defn); }
    }
    section_head += '</div>';

    if (section_foot) {
        section_foot = '<div class="_section-foot">'+section_foot+'</div>'
    }

    response = '<section class="'+this.defn.t.c_lass+'" id="s'+this.defn.id+'"'+section_attrs+'>'+section_head;
    response += '<table><col><col class="_content"><col><tr><td></td><td>'+section_before+'</td><td></td></tr>';
    response += '<tr><td>'+section_left+'</td><td>'+object_fn(children, this.defn)+'</td><td>'+section_right+'</td></tr>';
    response += '<tr><td></td><td>'+section_after+'</td><td></td></tr></table>';
    response += section_foot+'</section>';
    return response;
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
        var item_content = [];
        var item_classes = [];
        for (var i=0; i<children.length; i++) {
            if (typeof children[i].t.child_view != 'undefined' && typeof children[i].t.suppress_child == 'undefined') {
                item_content.push( children[i].t.child_view(parent) );
                item_classes.push( children[i].t.c_lass );
            }
        }

        var response = '<'+container+' '+container_attrs+'>';
        for (var i=0; i<item_content.length; i++) {
            var item_attrs = 'class="'+item_classes[i]+'" ';
            if (typeof item_attr_fn != 'undefined') {
                item_attrs += item_attr_fn( i, items.length );
            }
            response += '<'+item+' '+item_attrs+'>'+item_content[i]+cl_item;
        }
        response += cl_container;
        return response;
   });
}
