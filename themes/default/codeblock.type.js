x.prototype.section_head = function(parent) {
    return '<pre>'+this.html(this.defn.n)+'</pre>';
};

x.prototype.value = function() {
    return '<code>'+this.html(this.defn.n)+'</code>';
};

x.prototype.suppress_child = true;
