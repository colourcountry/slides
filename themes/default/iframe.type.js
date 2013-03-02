x.prototype.value = function() {

    return '<iframe width="1400" height="700" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+this.html(this.defn.n)+'" />';

};

x.prototype.toString = function() {
    return "[iframe-type "+this.get_class()+" value="+this.value()+"]";
}

