{
    get_subtitle : function() {
        return '<span class="_warning">Missing type &lsquo;'+this.defn.s+'&rsquo;</span> ';
    },

    value : function() {
        var content = '<span class="_warning">Missing type &lsquo;'+this.defn.s+'&rsquo;</span> '+this.sanitize_text(this.defn.n);
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
