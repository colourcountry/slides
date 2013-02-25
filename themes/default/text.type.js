x.prototype.child_view = function(parent) {
    if (typeof this.defn.c == 'undefined' || this.defn.c.length > 0) {
        /* undefined means there may be content but we haven't unrolled it yet to find out */
        /* FIXME: this shouldn't really refer to 'Dz' */
        return '<a onclick="Dz.in('+this.defn.id+'); window.event.preventDefault();" href="'+this.get_href(this.defn.id)+'">'+this.html(this.defn.n)+'</a>';
    } else {
        /* defn has no content for sure so there is no link */
        return this.html(this.defn.n);
    }
};

x.prototype.slide_view = function(children) {
    return this.list_view(children,'ul','li');
};

