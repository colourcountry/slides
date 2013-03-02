/* Down arrow to the right of the entries. Combine with y-axis for two opposing trends */
x.prototype.section_right = function(parent) {

    /* can't go in regular css as it's technically a separate document */
    var arrow_css="fill:white";

    return '<div style="position: relative; top: 0;"><svg style="height: 250px;" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 4 28"><g style="'+arrow_css+'"><path d="M 2 0 L 3 0 3 25 4 25 2.5 28 1 25 2 25 z"></path><text x="0" y="0" style="text-anchor: end; font-size: 2.5;" transform="rotate(-90)">'+this.value()+'</text></g></svg></div>';
};

x.prototype.suppress_child = true;
