{
    value : function() {
        return '<img src="'+this.sanitize_text(this.defn.n)+'">'
    },

    toString : function() {
        return "[image-type "+this.get_class()+" value="+this.value()+"]";
    },

    net_required : true
}

