var Pr = {
    cache: {},
    types: {},
    root_id: null,
    default_type: 'text',
    server_url: ''
};

Pr.init = function(dz) {

    this.find_deck( this.root_id, function(deck) {
        var slide_html = this.get_slides( deck.id, 0 );
        $('#slide-container').innerHTML = slide_html;

        console.debug('Inited slide-container with '+slide_html);

        if (typeof deck.c == 'undefined') {
            console.warn('children of '+deck.id+' not available');
            dz.init(this);
        } else if (deck.c.length == 0 ) {
            console.warn(JSON.stringify(deck)+' has no children so will not yield a slide');
            /* go to parent instead */
            window.location.href = deck.p;
        } else {
            dz.init(this);

            this.unroll_deck( deck.id, function( deck ) {
                var target = $('#cs'+deck.id );
                if (typeof deck.c != 'undefined') {
                    var slide_html = this.get_child_slides( deck.c, 0 );
                    target.innerHTML = slide_html;
                    console.debug('Added to #cs'+deck.id+' ('+target+') child slides '+slide_html);
                }
                target.removeAttribute('aria-unroll');
                dz.reinit();
            }.bind(this));
        }

        $('#title').innerHTML = this.cache[this.root_id].n;

    }.bind(this));
};

Pr.update_save_url = function() {
    var baked_cache = {};
    for ( var i in this.cache ) {
        baked_item = { id: this.cache[i].id };
        if (typeof this.cache[i].c != 'undefined') { baked_item.c = this.cache[i].c };
        if (typeof this.cache[i].n != 'undefined') { baked_item.n = this.cache[i].n };
        if (typeof this.cache[i].s != 'undefined') { baked_item.s = this.cache[i].s };
        if (typeof this.cache[i].p != 'undefined') { baked_item.p = this.cache[i].p };

        baked_cache[i] =  baked_item;
    };

    var data_url = '<!DOCTYPE html><html><head><title id="title">?</title><style id="styles">'+$('#styles').innerHTML;
    data_url += '</style><script id="scripts">'+$('#scripts').innerHTML;
    data_url += '</'+'script><script id="cache">Pr.cache = '+JSON.stringify(baked_cache)+';</'+'script></head>';
    data_url += '<body id="body"><div id="slide-count"></div><div id="save-button"><a href="#1.0">Save</a></div><div id="slide-container"></div><div id="progress-bar"></div></body>';
    data_url += '</html>';
    data_url = 'data:text/html;charset=utf-8,'+encodeURIComponent(data_url);

    $('#save-button a').href = data_url;
};

Pr.update_type = function(defn) {
    if (typeof defn.t == 'undefined') {
        if (typeof defn.s == 'undefined') {
            return new this.types[this.default_type](this,defn);
        } else if (typeof this.types[defn.s] == 'undefined') {
            multiType = defn.s.split(' ');
            if (multiType.length == 1) {
                /* not a multiple type, just an unknown one */
                console.debug("Unknown type "+defn.s);
                defn.t = new this.types[this.default_type](this,defn);
            } else {
                /* construct a multiple "type" (actually a singleton with explicitly set properties) */
                console.debug("Constructing new type "+defn.s);
                var newType = (function(typesAvailable) {
                    return function(pr, defn){ 
                        for (var i=0; i<multiType.length; i++) {
                            if (typeof typesAvailable[multiType[i]] == 'undefined') {
                                console.debug("Couldn't source type "+multiType[i]);
                            } else {
                                console.debug("Calling superconstructor "+multiType[i]);
                                typesAvailable[multiType[i]].call(this, pr, defn);
                            }
                        }
                    };
                })(this.types);
                var tempInstance = new this.types[multiType[multiType.length-1]](this,defn);
                for (property in tempInstance) {
                    console.debug("Adding property "+property+" from "+multiType[multiType.length-1]);
                    newType.prototype[property] = this.types[multiType[multiType.length-1]].prototype[property];
                }
                for (var i=multiType.length-2; i>=0; i--) {
                    if (typeof this.types[multiType[i]] != 'undefined') {
                        /* Object.keys returns only methods of this specific type, not inherited ones */
                        var properties = Object.keys(this.types[multiType[i]].prototype);
                        for (var j=0; j<properties.length; j++) {
                            console.debug("Adding modifying property "+properties[j]+" from "+multiType[i]);
                            newType.prototype[properties[j]] = this.types[multiType[i]].prototype[properties[j]];
                        }
                        tempInstance2 = new this.types[multiType[i]](this,defn);
                        for (var j=0; j<tempInstance2.c_lass.length; j++) {
                            tempInstance.add_class(tempInstance2.c_lass[j]);
                        }
                    }
                }
                this.types[defn.s] = newType;
                defn.t = new newType(this,defn);
                defn.t.c_lass = tempInstance.c_lass;
                console.debug("type "+defn.s+" has class "+defn.t.get_class());
            }
        } else {
            console.debug("Found type "+defn.s);
            defn.t = new this.types[defn.s](this,defn);
        };
    };
    console.debug("type "+defn.s+" is "+defn.t);
    return defn.t;
}

Pr.get_section = function(id, view) {
    console.log("get_section "+id);
    /* we can be sure it's in the cache already */
    var defn = this.cache[id];

    defn.t = this.update_type(defn);

    if (typeof defn.c == 'undefined') {
        var content = '<section id="s'+id+'"><h1>'+this.html(text)+'</h1>';
        return content + '<p><a href="'+this.get_href(id)+'">This slide has content which has not been downloaded.</a></p>';
    } else if (defn.c.length > 0) {
        var children_defn = [];
        for (var i=0; i<defn.c.length; i++) {
            var child = this.cache[defn.c[i]];
            child.t = this.update_type(child);
            children_defn.push(child);
        }
        return defn.t.slide_view(children_defn);
    } else {
        /* no children, do not expand */
        return '';
    }
};

Pr.get_slides = function(id, unroll) {

    console.debug( 'get_slides '+id );

    /* we can be sure it's in the cache already */
    var defn = this.cache[id];
    var content = '';

    if (typeof defn.c == 'undefined') {
        /* FIXME make this automatic if online */
        content = this.get_section(id);
    } else if (defn.c.length == 0) {
        /* zero length means there is definitely no content */
        content = this.get_section(id);
    } else if (unroll == 0) {
        content = this.get_section(id) + '<div id="cs'+id+'" aria-unroll="true"></div>';
    } else {
        content = this.get_section(id) + '<div id="cs'+id+'">' + get_child_slides(defn.c, unroll-1) + '</div>';
    }
    return content;
};

Pr.get_child_slides = function(id_list, unroll) {
    content = '';
    for (var i=0; i<id_list.length; i++) {
        content += this.get_slides( id_list[i], unroll );
    }
    return content;
};

Pr.add_to_caches = function(id, extract) {
    console.log("add_to_caches "+id);

    if (typeof extract[id] != 'undefined') {
        this.cache[id] = extract[id];
        if (typeof extract[id].c != 'undefined') {
            for (var i=0; i<extract[id].c.length; i++) {
                this.add_to_caches( extract[id].c[i], extract );
            }
        }
    } else {
        console.log("add_to_caches: extract didn't include "+id);
    };
};

Pr.find_deck = function(id, cb) {

    console.log("find_deck "+id);

    if (typeof this.cache[id] == 'undefined' || typeof this.cache[id].c == 'undefined') {
        var client = new XMLHttpRequest();
        client.onload = function() {
            var response = JSON.parse( client.responseText );
            this.add_to_caches( id, response );
            cb( this.cache[id] );
        }.bind(this);
        client.onerror = function() {
            alert("Failed to load more content: "+client.status+" "+client.statusText);
        };
        client.open("GET", Pr.server_url+"/extract/"+id+"?unroll=1", true);
        client.send();
    } else {
        cb( this.cache[id] );
    }
};

Pr.unroll_deck = function(id, cb) {

    console.log("unroll_deck "+id);

    /* we can be sure it's in the cache already */
    var defn = this.cache[id];
    var unrollNeeded = false;

    for (var i=0; i<defn.c.length; i++) {
        if (typeof this.cache[defn.c[i]] == 'undefined' ) {
            unrollNeeded = true;
            break;
        }
        for (var j=0; j<this.cache[defn.c[i]].c.length; j++) {
            if (typeof this.cache[this.cache[defn.c[i]].c[j]] == 'undefined') {
                unrollNeeded = true;
                break;
            }
        }
    }

    if (unrollNeeded) {
        var client = new XMLHttpRequest();
        client.onload = function() {
            var response = JSON.parse( client.responseText );
            this.add_to_caches( id, response );
            this.update_save_url();
            cb( this.cache[id] );
        }.bind(this);
        client.onerror = function() {
            cb( { n:'Content not available', c: [], id: 0 } );
            alert("Failed to load more content: "+client.status+" "+client.statusText);
        };
        client.open("GET", Pr.server_url+"/extract/"+id+"?unroll=2", true);
        client.send();
    } else {
        cb( this.cache[id] );
    }
};

init = function() {
    Pr.init(Dz);
    window.onkeydown = Dz.onkeydown.bind(Dz);
    window.onresize = Dz.onresize.bind(Dz);
    window.onhashchange = Dz.onhashchange.bind(Dz);
    window.onmessage = Dz.onmessage.bind(Dz);
};

window.onload = init;
