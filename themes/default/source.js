
/*
Pr.types['image',
                child_view: function(defn) { return '<img src="'+this.html(defn.n)+'">' }
});

Pr.types['background-image': function(defn) { return '<img src="'+this.html(defn.n)+'">' },

Pr.types['text',
    'codeblock': function(defn) { return '<div class="codeblock">'+this.html(defn.n)+'</div>' }

Pr.types['ul',
                slide_view: Pr.list_view('ul','li'),
                child_view_as: 'text'
});

Pr.types['p',
                slide_view: Pr.list_view('','p')
});

Pr.types['ul-build',
                slide_view: Pr.list_view('ul','li','class="incremental"')
});

Pr.types['ol',
                slide_view: Pr.list_view('ol','li')
});

Pr.types['ol-build',
                slide_view: Pr.list_view('ol','li', 'class="incremental"')
});

Pr.types['bubbles',
                slide_view: Pr.cluster_view( "bubble", true, function( idx, total ) {
                    if ( idx==total-1 && idx>3 ) {
                        var x = 250;
                        var y = 220;
                    } else {
                        var x = 250-Math.cos(idx*1.4+0.3)*200;
                        var y = 200-Math.sin(idx*1.4+0.3)*150;
                    }
                    return "left: "+x+"px; bottom: "+y+"px";
                })
});

Pr.types['boxes',
                slide_view: Pr.cluster_view( "box", true, function( idx, total ) {
                    var width = 700/total;
                    var x = width*idx+50;
                    return "height: 300px; width: "+width+"px; left: "+x+"px; bottom: 50px";
                })
})

Pr.child_views = {};
    'image': function(defn) { return '<img src="'+this.html(defn.n)+'">' },
    'background-image': function(defn) { return '<img src="'+this.html(defn.n)+'">' },
    'codeblock': function(defn) { return '<div class="codeblock">'+this.html(defn.n)+'</div>' }
};

Pr.slide_views = {};

*/
