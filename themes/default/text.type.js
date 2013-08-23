{
    child_view : function(parent) {
        return this.value();
    },

    slide_view : function(children) {
        return this.object_view(children);
    },

    get_title : function(children) {
        if (typeof this.defn.k == 'undefined') {
            return this.sanitize_html(this.defn.n);
        } else {
            return this.sanitize_html(this.defn.k);
        }
    },

    get_object : function(children) {
        return this.list_view(children, 'ul','li');
    },

    get_item_attrs : function( idx, total ) { return '' },

    get_list_attrs : function() { console.debug( 'no list-attrs for text-type '+this.defn.s+' ('+this.value()+') ');return '' },

    value : function() {
        if (typeof this.defn.c == 'undefined' || this.defn.c.length > 0) {
            /* undefined means there may be content but we haven't unrolled it yet to find out */
            /* FIXME: this shouldn't really refer to 'Dz' */
            return '<a onclick="Dz.in(\''+this.defn.id+'\'); window.event.preventDefault();" href="'+this.get_href(this.defn.id)+'">'+this.sanitize_text(this.defn.n)+'</a>';
        } else {
            /* defn has no content for sure so there is no link */
            return this.sanitize_text(this.defn.n);
        }
    },

    toString : function() {
        return "[text-type "+this.get_class()+" value="+this.value()+"]";
    },

}
