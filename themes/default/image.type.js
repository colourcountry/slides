x.prototype.value = function() {
    return '<img src="'+this.html(this.defn.n)+'">'
};

x.prototype.toString = function() {
    return "[image-type "+this.get_class()+" value="+this.value()+"]";
}

