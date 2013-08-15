{
    value : function() {
        return '<img src="'+this.html(this.defn.n)+'">'
    },

    toString : function() {
        return "[image-type "+this.get_class()+" value="+this.value()+"]";
    }
}

