{
    section_head : function(parent) {
        return '<pre>'+this.html(this.defn.n)+'</pre>';
    },

    value : function() {
        return '<code>'+this.html(this.defn.n)+'</code>';
    },

    suppress_child : true
}
