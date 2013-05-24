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

        $('#title').innerHTML = this.cache[this.root_id].n;

        if (typeof Blob == 'undefined') {
            alert("No blob support. Removing save button");
            var save_button = $('#save-button');
            save_button.parentNode.removeChild(save_button);
            var new_button = $('#new-button');
            new_button.parentNode.removeChild(new_button);
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

    var std_head = '<!DOCTYPE html><html><head><title id="title">?</title><meta charset="utf-8"><style id="styles">'+$('#styles').innerHTML+'</style><script id="scripts">'+$('#scripts').innerHTML+'</'+'script>';
    var std_body = '<body id="body"><div id="slide-count"></div><div id="new-button"><a href="#1.0">New</a></div><div id="save-button"><a href="#1.0">Save</a></div><div id="slide-container"></div><div id="progress-bar"></div><div id="edit"></div></body>';
    var save_blob = '' + std_head;
    if (Pr.server_url) {
        save_blob += '<script id="server-url">Pr.server_url = '+JSON.stringify(Pr.server_url)+';</'+'script>';
    }

    save_blob += '<script id="cache">Pr.cache = '+JSON.stringify(baked_cache)+';</'+'script></head>'+std_body+'</html>';
    var save_url = window.URL.createObjectURL(new Blob([save_blob],{'type':'application/octet-stream'}));

    // FIXME don't regenerate this all the time it's stupid
    var new_blob = std_head+'<script id="cache">Pr.cache = {"1":{"id":1,"n":"New Presentable","c":[2]},"2":{"id":2,"p":1,"n":"Press Escape to edit","c":[]}};</'+'script></head>'+std_body+'</html>';
    var new_url = window.URL.createObjectURL(new Blob([new_blob],{'type':'text/html'}));

    var old_save_url = $('#save-button a').href;
    if (old_save_url.substring(0,5)=='blob:') {
        console.debug("revoking old save URL "+old_save_url);
        window.URL.revokeObjectURL(old_save_url);
    }
    $('#save-button a').href = save_url;
    $('#save-button a').download = this.cache[this.root_id].n+'.html';

    var old_new_url = $('#new-button a').href;
    if (old_new_url.substring(0,5)=='blob:') {
        console.debug("revoking old new URL "+old_new_url);
        window.URL.revokeObjectURL(old_new_url);
    }

    // it's nice to make new just go straight in but it's not to be, because blob urls don't take hashes
    $('#new-button a').href = new_url;
    $('#new-button a').download = 'new.html';
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

Pr.get_section = function(id) {
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
        content = '<div id="ss'+id+'">'+this.get_section(id) + '</div>';
    } else if (defn.c.length == 0) {
        /* zero length means there is no content, but need a placeholder if we later edit it */
        content = '<div id="ss'+id+'">'+this.get_section(id) + '</div><div id="cs'+id+'"></div>';
    } else if (unroll == 0) {
        /* this means there might be content that awaits unrolling */
        content = '<div id="ss'+id+'">'+this.get_section(id) + '</div><div id="cs'+id+'" pr-unroll="true"></div>';
    } else {
        content = '<div id="ss'+id+'">'+this.get_section(id) + '</div><div id="cs'+id+'">' + get_child_slides(defn.c, unroll-1) + '</div>';
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

    console.log("find_deck "+id);

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

Pr.populate_editor = function(node, root_id, replace) {
    var div = document.createElement("div");
    div.id = "ed"+root_id;
    if (typeof this.cache[root_id] == 'undefined') {
        div.innerHTML = '<span>not available</span>';
    } else {
        if (typeof this.cache[root_id].s == 'undefined') {
            var type_html = '<input class="_type" id="edt'+root_id+'" value="'+this.default_type+'">';
        } else {
            var type_html = '<input class="_type" id="edt'+root_id+'" value="'+this.cache[root_id].s+'">';
        }

        var content_attr = this.cache[root_id].n.replace(/(&)|(")|(\u00A0)/g, function(match, amp, quote) {
            if (amp) return "&amp;";
            if (quote) return "&quot;";
            return "&nbsp;";
        });

        var input_attrs = '';
        var slide_section = $('#s'+root_id);
        if (!slide_section) {
            // slide has not been unrolled or does not yield a slide
            // can still edit it but will not jump there on exit
            input_attrs = 'class="_no_slide"';
        }

        var input_html = '<input '+input_attrs+' id="edi'+root_id+'" value="'+content_attr+'">';

        div.innerHTML = type_html + input_html;

        if (typeof this.cache[root_id].c != 'undefined') {
            for (var i=0; i<this.cache[root_id].c.length; i++) {
                this.populate_editor(div, this.cache[root_id].c[i]);
            }
        }

        if (replace) {
            node.replaceChild(div,replace);
        } else {
            node.appendChild(div);
        }
    }
};

Pr.update_cache_from_editor = function(root_id) {
    if (typeof this.cache[root_id] != 'undefined') {
        var node = $('#edi'+root_id);
        console.log('#edi'+root_id+' is '+node);
        var new_value = $('#edi'+root_id).value;
        console.log(new_value);
        if (new_value) {
            this.cache[root_id].n = new_value;
        }
        if (typeof this.cache[root_id].c != 'undefined') {
            for (var i=0; i<this.cache[root_id].c.length; i++) {
                this.update_cache_from_editor(this.cache[root_id].c[i]);
            }
        }
    }    
};

Pr.reboot_slides = function(root_id) {
    if (typeof this.cache[root_id] != 'undefined') {
        slide_div = $('#ss'+root_id);
        if (slide_div) {
            slide_div.innerHTML = this.get_section(root_id);
        }
        if (typeof this.cache[root_id].c != 'undefined') {
            for (var i=0; i<this.cache[root_id].c.length; i++) {
                this.reboot_slides(this.cache[root_id].c[i]);
            }
        }
    }    
};

Pr.edit = function(id, reinitCb) {
    var edit_box = $('#edit');
    if (edit_box.style.visibility != 'visible') {
        console.debug('showing editor');
        this.populate_editor(edit_box, this.root_id);
        edit_box.style.visibility = 'visible';
        focus = $('#edi'+id);
        if (focus) {
            focus.classList.add("_highlight");
            focus.focus();
            focus.selectionStart = 0;
            focus.selectionEnd = focus.value.length;
            focus.scrollIntoView();
        }
    } else {
        console.debug('hiding editor');
        edit_box.style.visibility = 'hidden';
        this.update_cache_from_editor(this.root_id);
        this.reboot_slides(this.root_id);
        var new_slide = document.activeElement.id;
        if (new_slide.substring(0,3)=='edi'){
            console.debug('returning to slide '+new_slide.substring(3));
            reinitCb(new_slide.substring(3));
        } else {
            reinitCb();
        }
        edit_box.innerHTML = '';
    }
};

Pr.handle_edit_key = function(aEvent) {
    if (aEvent.keyCode == 38) { // up arrow
        aEvent.preventDefault();
        // TODO work like shift-tab?
    } else
    if (aEvent.keyCode == 40) { // down arrow
        aEvent.preventDefault();
        // TODO work like tab?
    } else
    if (aEvent.keyCode == 13) { // enter
        aEvent.preventDefault();
        var focus_id = document.activeElement.id.substring(3);

        console.debug("adding to "+focus_id);
        if (this.cache[focus_id] && typeof this.cache[focus_id].p != 'undefined') {

            // server will promise not to create ids with "x" in
            // when resyncing with BoK these will get a "real" id
            var count = 1;
            while ( this.cache[focus_id+"x"+count] ) {
                count += 1;
            }
            var new_id = focus_id+"x"+count;

            if (aEvent.shiftKey && typeof this.cache[focus_id].c != undefined && this.cache[focus_id].c.length == 0) {
                console.debug("adding new child "+new_id);
                var parent_id = focus_id;
            } else {
                console.debug("adding new sibling "+new_id);
                var parent_id = this.cache[focus_id].p;
            }

            // going to replace parent so ensure all edits are saved
            this.update_cache_from_editor(parent_id);

            this.cache[new_id] = { n: '',
                                   id: new_id,
                                   s: this.default_type,
                                   p: parent_id,
                                   c: [] };

            if ( parent_id == focus_id ) {
                this.cache[parent_id].c = [new_id];
                console.debug('unrollabilifying #cs'+this.cache[parent_id].p);
                // need to let the slide code know that the (now grand-)parent is now unrollable
                //$('#cs'+this.cache[parent_id].p).setAttribute('pr-unroll','true');
            } else {
                var sibling_ids = this.cache[parent_id].c;
                var new_sibling_ids = [];
                for ( var i=0; i<sibling_ids.length; i++) {
                    new_sibling_ids.push(sibling_ids[i]);
                    if (sibling_ids[i] == focus_id) {
                        new_sibling_ids.push(new_id);
                    }
                }
                this.cache[parent_id].c = new_sibling_ids;
            }

            console.debug("replacing "+parent_id);
            replace_node = $('#ed'+parent_id);
            this.populate_editor(replace_node.parentNode, parent_id, replace_node);

            $('#edi'+new_id).focus();
        }
    }
}


init = function() {
    Pr.init(Dz);
    window.onkeydown = Dz.onkeydown.bind(Dz);
    window.onresize = Dz.onresize.bind(Dz);
    window.onhashchange = Dz.onhashchange.bind(Dz);
    window.onmessage = Dz.onmessage.bind(Dz);
};

window.onload = init;
