var Ty = function(pr, defn){ 
    this.defn = defn;
    this.pr = pr;
    this.c_lass = [];
};

Ty.prototype.TEXT_REPLACE = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;', '\\n': '\n' };

Ty.prototype.sanitize_text = function(text) {
    return text.replace(/[\"&<>]|\\n/g, function (a) { return this.TEXT_REPLACE[a]; }.bind(this));
};

/* These are all the defensible inline elements in HTML5 in my humble opinion */
Ty.prototype.HTML_REPLACE = { 'a': 'a', 'abbr': 'abbr', 'b': 'b',  'cite': 'cite', 'del': 'del',
                              'dfn': 'dfn', 'em': 'em', 'i': 'i', 'ins': 'ins',
                              'kbd': 'kbd', 'mark': 'mark', 'q': 'q', 'small': 'small',
                              'span': 'span', 'strong': 'strong', 'sub': 'sub',
                              'sup': 'sup', 'time': 'time', 'var': 'var' };

Ty.prototype.sanitize_html = function(html) {
    return html.replace(/<([/]?)([^ >]+)([^>]*)>/g, function (a, s, p, x) {
        if (typeof this.HTML_REPLACE[p] == "undefined") {
            return "";
        } else {
            return "<"+s+this.HTML_REPLACE[p.toLowerCase()]+x+">";
        }
    }.bind(this)).replace('\\n','\n');
};

Ty.prototype.get_href = function(id) {
    return '#'+id+'.0';
};

Ty.prototype.toString = function() {
    return "[type "+this.get_class()+" defn="+this.defn.n+"]";
}

Ty.prototype.add_class = function(className) {
    var found = false;
    for (var i=0; i<this.c_lass.length; i++) {
        if (this.c_lass[i]==className) {
            found = true;
        }
    };
    if (!found) {
        this.c_lass.push(className);
    }
};

Ty.prototype.get_class = function() {
    var result = '';
    if (typeof this.c_lass != 'undefined') {
        for (var i=0; i<this.c_lass.length; i++) {
            result += this.c_lass[i] + ' ';
        }
    }
    return result;
};

Ty.prototype.object_view = function(children) {

    var section_attrs = '';
    var section_head = '<div class="_section-head"><h1>'+this.get_title()+'</h1>';
    var section_before = '<div class="_section-before">'+this.get_subtitle();
    var section_left = '';
    var section_after = '';
    var section_right = '';
    var section_foot = '';
    for (var i=0; i<children.length; i++) {
        console.debug("object_view child "+children[i].s+" "+children[i].t);
        if (typeof children[i].t.section_attrs != 'undefined') { section_attrs += ' '+children[i].t.section_attrs(this.defn); }
        if (typeof children[i].t.section_head != 'undefined') { section_head += children[i].t.section_head(this.defn); }
        if (typeof children[i].t.section_before != 'undefined') { section_before += children[i].t.section_before(this.defn); }
        if (typeof children[i].t.section_left != 'undefined') { section_left += children[i].t.section_left(this.defn); }
        if (typeof children[i].t.section_after != 'undefined') { section_after += children[i].t.section_after(this.defn); }
        if (typeof children[i].t.section_right != 'undefined') { section_right += children[i].t.section_right(this.defn); }
        if (typeof children[i].t.section_foot != 'undefined') { section_foot += children[i].t.section_foot(this.defn); }
    }
    section_head += '</div>';
    section_before += '</div>';

    if (section_foot) {
        section_foot = '<div class="_section-foot">'+section_foot+'</div>'
    }

    var response = '<section class="'+this.get_class()+'" id="s'+this.defn.id+'"'+section_attrs+'>'+section_head;
    response += '<table><col class="_left"><col class="_object"><col class="_right"><tr><td></td><td class="_before">'+section_before+'</td><td></td></tr>';
    response += '<tr><td class="_left">'+section_left+'</td><td class="_object">'+this.get_object(children)+'</td><td class="_right">'+section_right+'</td></tr>';
    response += '<tr><td></td><td class="_after">'+section_after+'</td><td></td></tr></table>';
    response += section_foot+'</section>';
    return response;
}

Ty.prototype.list_view = function(children, container, item) {

    var cl_item = '';

    if (typeof item == 'undefined' || item == '') {
        item = '';
    } else {
        cl_item = '</'+item+'>';
    }

    var cl_container = '';

    if (typeof container == 'undefined' || container == '') {
        container = '';
    } else {
        cl_container = '</'+container+'>';
    }

    var item_content = [];
    var item_classes = [];
    for (var i=0; i<children.length; i++) {
        if (typeof children[i].t.child_view != 'undefined' && typeof children[i].t.suppress_child == 'undefined') {
            item_content.push( children[i].t.child_view(this) );
            item_classes.push( children[i].t.get_class() );
        }
    }

    if (typeof this.get_list_attrs == 'undefined') {
        var response = '<'+container+' class="_no_attrs">';
    } else {
        var response = '<'+container+' '+this.get_list_attrs()+'>';
    }
    for (var i=0; i<item_content.length; i++) {
        var item_attrs = 'class="'+item_classes[i]+'" ';
        if (typeof this.get_item_attrs != 'undefined') {
            item_attrs += this.get_item_attrs( i, item_content.length );
        }
        response += '<'+item+' '+item_attrs+'>'+item_content[i]+cl_item;
    }
    response += cl_container;
    return response;
}
