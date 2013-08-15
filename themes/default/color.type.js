{
    value : function() {
        return '<div style="background-color: '+this.html(this.defn.n)+'"></div>';
    },

    toString : function() {
        return "[color-type "+this.get_class()+" value="+this.value()+"]";
    }
}

