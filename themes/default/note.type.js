{
    value : function() {
        var content = '<span class="_note">'+this.sanitize_text(this.defn.n)+'</span>';
        if (typeof this.defn.c == 'undefined' || this.defn.c.length > 0) {
            /* undefined means there may be content but we haven't unrolled it yet to find out */
            /* FIXME: this shouldn't really refer to 'Dz' */
            return '<a onclick="Dz.in(\''+this.defn.id+'\'); window.event.preventDefault();" href="'+this.get_href(this.defn.id)+'">'+content+'</a>';
        } else {
            /* defn has no content for sure so there is no link */
            return content;
        }
    }
}
