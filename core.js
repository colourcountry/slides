var Pr = {
    cache: {},
    types: {},
    root_id: null,
    default_type: 'html',
    fallback_type: 'fallback',
    server_url: '',
    std_body: '',
    net_required: {},
    text_indent: '. '
};

Pr.init = function(dz) {

    this.find_deck( this.root_id, function(deck) {
        this.reboot_slides(deck.id);

        if (typeof deck.c == 'undefined') {
            console.warn('children of '+deck.id+' not available');
            dz.init(this);
        } else if (deck.c.length == 0 ) {
            console.warn(deck.n+' ('+deck.id+') has no children so will not yield a slide');
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
                target.removeAttribute('pr-unroll');
                dz.reinit();
            }.bind(this));
        }

        if (this.server_url) {
            var server = $('#server');
            server.firstChild.nodeValue = this.server_url;
            server.href = this.server_url;
        } else {
            $('#server').innerHTML = "<i>No server</i>";
        }

        if (typeof Blob == 'undefined') {
            console.warn("No blob support. Removing save button");
            var save_button = $('#save-button');
            save_button.parentNode.removeChild(save_button);
        };

    }.bind(this));
};

Pr.update_save_url = function() {
    if (!$('#save-button')) {
        // No save button (probably because no Blob support)
        return;
    }

    var baked_cache = {};
    for ( var i in this.cache ) {
        baked_item = { id: this.cache[i].id };
        if (typeof this.cache[i].c != 'undefined') { baked_item.c = this.cache[i].c };
        if (typeof this.cache[i].n != 'undefined') { baked_item.n = this.cache[i].n };
        if (typeof this.cache[i].s != 'undefined') { baked_item.s = this.cache[i].s };
        if (typeof this.cache[i].p != 'undefined') { baked_item.p = this.cache[i].p };

        baked_cache[i] =  baked_item;
    };

    var std_head = '<!DOCTYPE html><html class="_view"><head><title id="title">?</title><meta charset="utf-8"><style id="styles">'+$('#styles').innerHTML+'</style><script id="scripts">'+$('#scripts').innerHTML+'</'+'script>';
    var save_blob = '' + std_head;
    if (Pr.server_url) {
        save_blob += '<script id="server-url">Pr.server_url = '+JSON.stringify(Pr.server_url)+';</'+'script>';
    }

    save_blob += '<script id="cache">Pr.cache = '+JSON.stringify(baked_cache)+';</'+'script></head>'+this.std_body+'</html>';
    var save_url = window.URL.createObjectURL(new Blob([save_blob],{'type':'application/octet-stream'}));
    console.debug("generated new save URL "+save_url);

    var old_save_url = $('#save-button a').href;
    if (old_save_url.substring(0,5)=='blob:') {
        console.debug("revoking old save URL "+old_save_url);
        window.URL.revokeObjectURL(old_save_url);
    }

    $('#save-link').href = save_url;
    $('#save-link').download = this.cache[this.root_id].n.replace(/<[^>]+>/g,'')+'.html';
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
                defn.t = new this.types[this.fallback_type](this,defn);
            } else {
                /* construct a multiple "type" (actually a singleton with explicitly set properties) */
                console.debug("Constructing new type "+defn.s);
                var newType = (function(cTypesAvailable,cMultiType) {
                    return function(pr, defn){ 
                        for (var i=0; i<cMultiType.length; i++) {
                            if (typeof cTypesAvailable[cMultiType[i]] == 'undefined') {
                                console.debug("Couldn't source type "+cMultiType[i]+" to construct multi-type "+JSON.stringify(cMultiType));
                            } else {
                                console.debug("Calling superconstructor "+cMultiType[i]);
                                cTypesAvailable[cMultiType[i]].call(this, pr, defn);
                            }
                        }
                    };
                })(this.types, multiType);
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

Pr.add_net_required = function(id) {
    this.net_required[id] = true;
    console.debug("Item "+id+" requires net, now "+JSON.stringify(this.net_required));
}

Pr.is_net_required = function(id) {
    return (typeof this.net_required[id] != "undefined" && this.net_required[id]);
}


Pr.get_section = function(id) {
    console.debug("get_section "+id);
    /* we can be sure it's in the cache already */
    var defn = this.cache[id];

    console.debug("Updating type "+defn.s+" for "+defn.id);
    defn.t = this.update_type(defn);
    console.debug("Updated type "+defn.s+" for "+defn.id);

    if (typeof defn.t.net_required != 'undefined' || defn.t.net_required) {
        this.add_net_required(id);
    }

    if (typeof defn.c == 'undefined') {
        var content = '<section id="s'+id+'"><h1>'+this.html(text)+'</h1>';
        console.warn("Content of slide "+id+" has not been downloaded")
        return content + '<p><a href="'+this.get_href(id)+'">This slide has content which has not been downloaded.</a></p>';
    } else if (defn.c.length > 0) {
        var children_defn = [];
        for (var i=0; i<defn.c.length; i++) {
            console.debug("updating child "+defn.c[i]+" for "+id);
            if (typeof this.cache[defn.c[i]] == 'undefined') {
                console.error("Slide missing from cache: "+defn.c[i]);
                return '';
            }
            var child = this.cache[defn.c[i]];
            child.t = this.update_type(child);
            console.debug("updating child type "+child.s+" for "+defn.c[i]+" child of "+id);
            children_defn.push(child);
            if (typeof child.t.net_required != 'undefined' || child.t.net_required) {
                this.add_net_required(id);
            }
        }

        console.debug("get_section "+id+" result: ("+defn.n+", "+defn.t.toString()+", "+children_defn.length+" items)");
        return defn.t.slide_view(children_defn);

    } else {
        /* no children, do not expand */
        console.debug("get_section "+id+" result: no children");
        return '';
    }
};

Pr.get_slides = function(id, unroll) {

    console.debug( 'get_slides '+id );

    /* we can be sure it's in the cache already */
    var defn = this.cache[id];
    var content = '';

    var section = this.get_section(id);
    var c_lass = '';

    if (section) {
        c_lass+='_ss ';
        if (this.is_net_required(id)) {
            c_lass+='_net ';
        }
    }

    if (c_lass) {
        c_lass = 'class="'+c_lass+'"';
    }

    if (typeof defn.c == 'undefined') {
        /* FIXME make this automatic if online */
        content = '<div id="ss'+id+'" '+c_lass+'>'+this.get_section(id) + '</div>';
    } else if (defn.c.length == 0) {
        /* zero length means there is no content, but need a placeholder if we later edit it */
        content = '<div id="ss'+id+'" '+c_lass+'>'+this.get_section(id) + '</div><div id="cs'+id+'"></div>';
    } else if (unroll == 0) {
        /* this means there might be content that awaits unrolling */
        content = '<div id="ss'+id+'" '+c_lass+'>'+this.get_section(id) + '</div><div id="cs'+id+'" class="_cs" pr-unroll="true"></div>';
    } else {
        content = '<div id="ss'+id+'" '+c_lass+'>'+this.get_section(id) + '</div><div id="cs'+id+'" class="_cs">' + get_child_slides(defn.c, unroll-1) + '</div>';
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
    if (typeof extract[id] != 'undefined') {
        this.cache[id] = extract[id];
        if (typeof extract[id].c != 'undefined') {
            for (var i=0; i<extract[id].c.length; i++) {
                this.add_to_caches( extract[id].c[i], extract );
            }
        }
    } else {
        console.debug("add_to_caches: extract didn't include "+id);
    };
};

Pr.find_deck = function(id, cb) {

    console.debug("find_deck "+id);

    if (typeof this.cache[id] == 'undefined' || typeof this.cache[id].c == 'undefined') {
        if (Pr.server_url) {
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
            alert("This Presentable doesn't have a server to load more content from.");
        }
    } else {
        cb( this.cache[id] );
    }
};

Pr.unroll_deck = function(id, cb) {

    console.debug("unroll_deck "+id);

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
        if (Pr.server_url) {
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
            alert("This Presentable doesn't have a server to load more content from.");
        }
    } else {
        cb( this.cache[id] );
    }
};

Pr.convert_to_text = function(root_id, highlight_id, indent) {
    if (indent == null) {
        indent = '';
    }
    var type = '';
    if (typeof this.cache[root_id].s != 'undefined' && this.cache[root_id].s != this.default_type) {
        type = this.cache[root_id].s+': ';
    }
    var children_as_text = '';
    if (typeof this.cache[root_id].c != 'undefined') {
        for (var i=0; i<this.cache[root_id].c.length; i++) {
            children_as_text += this.convert_to_text(this.cache[root_id].c[i], highlight_id, indent+this.text_indent );
        }
    }

    var highlight_indent = indent;
    if (root_id == highlight_id && root_id != this.root_id ) {
        highlight_indent=Array(indent.length).join('>')+' ';
    }

    return highlight_indent+type+this.cache[root_id].n+'\n'+children_as_text;
}

Pr.populate_editor = function(node, root_id, highlight_id) {
    var div = document.createElement("div");
    div.id = "ed"+root_id; /*FIXME too many divs?*/
    if (typeof this.cache[root_id] == 'undefined') {
        div.innerHTML = '<span>not available</span>';
    } else {
        var content = this.convert_to_text(root_id, highlight_id).replace(/(&)|(<)|(>)|(\u00A0)/g, function(match, amp, lt, gt) {
            if (amp) return "&amp;";
            if (lt) return "&lt;";
            if (gt) return "&gt;";
            return "&nbsp;";
        });

        div.innerHTML = '<textarea id="editarea">'+content+'</textarea>';
        node.appendChild(div);
    }
};

Pr.reboot_cache_from_string = function(strg) {
    var lines = strg.split('\n');
    this.cache = {};
    console.debug('rebooting cache from '+lines.length+' lines: '+JSON.stringify(lines));

    while (lines[lines.length-1] == "") {
        lines.pop();
    }

    if (lines.length == 0) {
        console.debug('adding placeholder root title');
        lines.push("New presentation");
    }

    if (lines.length == 1) {
        console.debug('adding placeholder first point');
        lines.push(". Add lines here");
    }

    if (lines[0] == "") {
        console.debug('empty title, replacing with placeholder');
        lines[0] = "Title";
    }

    console.debug('rebooting cache with '+lines.length+' lines: '+JSON.stringify(lines));
    return this.update_cache_children_from_lines( 0, lines );
    console.debug('done rebooting cache');
};

Pr.update_cache_children_from_lines = function(start_at, lines, parent_id) {

    var root_parts = /(>*[\s.]*)\[([^\]]+)\] *(.*)/.exec( lines[start_at] );

    if ( root_parts != null ) {
        var root_indent = root_parts[1].length;
        var root_id = root_parts[2];
        var root_body = root_parts[3];
        console.debug('using supplied id in line '+lines[start_at]);
    } else {
        root_parts = /(>*[\s.]*)(.*)/.exec( lines[start_at] ); /* always matches */
        var root_indent = root_parts[1].length;
        var root_id = ''+(start_at+1); /* FIXME better id generation */
        var root_body = root_parts[2];
        console.debug('using new id '+root_id+' in line '+lines[start_at]);
    }

    if (start_at == 0) {
        /* The very first line is treated specially:
           later lines with indent == 0 will be added as children of this slide.
        */
        root_indent = -1;
    }

    var root_body_parts = /^([a-z ]+):\s*(.*)/.exec( root_body );

    if ( root_body_parts != null ) {
        var root_type = root_body_parts[1];
        var root_text = root_body_parts[2];
    } else {
        var root_type = this.default_type;
        var root_text = root_body;
    }

    var child_ids = new Array();

    console.debug('id '+root_id+' => '+root_type+' / '+root_text);

    this.cache[root_id] = { 'id': root_id,
                            'n': root_text,
                            's': root_type };

    if ( parent_id ) {
        this.cache[root_id].p = parent_id;
    }

    if ( start_at+1 < lines.length ) {
        var i = start_at+1;
        var child_indent = (lines[start_at+1].match(/>*[\s.]*/))[0].length;
        var new_indent = child_indent;

        while (new_indent > root_indent && i < lines.length) {
            new_indent = (lines[i].match(/>*[\s.]*/))[0].length;
            if (new_indent > root_indent && new_indent <= child_indent) {
                child_indent = new_indent;
                result = this.update_cache_children_from_lines( i, lines, root_id )
                child_ids.push( result );
            }
            i += 1;
        }
    }

    this.cache[root_id].c = child_ids;
    console.debug('Finished '+root_id+': '+JSON.stringify(this.cache[root_id]));

    return root_id;
};

Pr.reboot_slides = function(root_id) {
    var slide_html = this.get_slides( root_id, 0 );
    window.document.title = this.get_title( root_id );
    $('#slide-container').innerHTML = slide_html;
    this.root_id = root_id;
    console.debug('Inited slide-container with '+slide_html);
};

Pr.get_title = function(root_id) {
    return this.cache[root_id].n.replace(/<[^>]+>/g, '');
}

Pr.hide_editor = function(id, reinitCb) {
    var edit_box = $('#edit');
    this.root_id = this.reboot_cache_from_string($('#editarea').value);
    console.debug('parsed new text definition, root is now '+this.root_id);
    this.reboot_slides(this.root_id);
    console.debug('rebooted slides');
    reinitCb(this.root_id);
    console.debug('hiding editor');
    edit_box.innerHTML = '';
}

Pr.show_editor = function(current_id) {
    var edit_box = $('#edit');
    console.debug('showing editor');
    this.populate_editor(edit_box, this.root_id, current_id);
    $('#editarea').focus();
};

Pr.handle_edit_key = function(aEvent) {
}

init = function() {
    Pr.init(Dz);
    window.onkeydown = Dz.onkeydown.bind(Dz);
    window.onresize = Dz.onresize.bind(Dz);
    window.onhashchange = Dz.onhashchange.bind(Dz);
    window.onmessage = Dz.onmessage.bind(Dz);
};

window.onload = init;
