x.prototype.section_left = function(parent) {

    /* can't go in regular css as it's technically a separate document */
    var arrow_css="fill:white";

    return '<div><svg style="height: 560px;" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 3 28"><g style="'+arrow_css+'"><path d="M 2 28 L 3 28 3 3 4 3 2.5 0 1 3 2 3 z"></path><text x="-28" y="0" style="text-anchor: start; font-size: 2.5;" transform="rotate(-90)">'+this.value()+'</text></g></svg></div>';
};

x.prototype.suppress_child = true;
