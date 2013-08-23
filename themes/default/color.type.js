{
    value : function() {
        return '<div style="background-color: '+this.sanitize_text(this.defn.n)+'"></div>';
    },

    toString : function() {
        return "[color-type "+this.get_class()+" value="+this.value()+"]";
    }
}

