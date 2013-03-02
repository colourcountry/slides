x.prototype.section_head = function(parent) {
    return '<figure class="'+this.get_class()+'"><figcaption>'+this.value()+'</figcaption></figure>';
};

x.prototype.suppress_child = true;

