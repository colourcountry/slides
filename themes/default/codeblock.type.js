{
    section_head : function(parent) {
        return '<pre>'+this.sanitize_text(this.defn.n)+'</pre>';
    },

    value : function() {
        return '<code>'+this.sanitize_text(this.defn.n)+'</code>';
    },

    suppress_child : true
}
