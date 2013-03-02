x.prototype.child_view = function(parent) {
    return this.value();
};

x.prototype.slide_view = function(children) {
    return this.object_view(children);
};

x.prototype.get_object = function(children) {
    return this.list_view(children, 'ul','li');
}

x.prototype.get_item_attrs = function( idx, total ) { return '' };

x.prototype.get_list_attrs = function() { console.debug( 'no list-attrs for text-type '+this.defn.s+' ('+this.value()+') ');return '' };

x.prototype.value = function() {
    if (typeof this.defn.c == 'undefined' || this.defn.c.length > 0) {
        /* undefined means there may be content but we haven't unrolled it yet to find out */
        /* FIXME: this shouldn't really refer to 'Dz' */
        return '<a onclick="Dz.in('+this.defn.id+'); window.event.preventDefault();" href="'+this.get_href(this.defn.id)+'">'+this.html(this.defn.n)+'</a>';
    } else {
        /* defn has no content for sure so there is no link */
        return this.html(this.defn.n);
    }
};

x.prototype.toString = function() {
    return "[text-type "+this.get_class()+" value="+this.value()+"]";
}
