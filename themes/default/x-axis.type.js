{
    section_after : function(parent) {

        /* can't go in regular css as it's technically a separate document */
        var arrow_css="fill:white";

        return '<div><svg style="width: 760px; height: 240px;" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 38 6"><g style="'+arrow_css+'"><path d="M 0 1 L 0 2 35 2 35 3 38 1.5 35 0 35 1 z"></path><text x="0" y="5" style="text-anchor: start; font-size: 2.5;">'+this.value()+'</text></g></svg></div>';
    },

    suppress_child :true
}

