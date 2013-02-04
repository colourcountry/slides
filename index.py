#!/usr/bin/python3

import os, sys, json
import slide
import bottle
bottle.debug(True)

MY_PATH = os.path.dirname(__file__)

sys.path.append(MY_PATH)


TEST_TEXT='''
Presentation
    A
    B
        1
            a
                x
                y
                z
            b
                j
                k
                    l
                    m
                    n
                    o
                        p
                        q
                        r
        2
            aa
        3
            aaa
            bbb
    C
        [] 11
        [22] 22
    [D] D
        111
            [aaaa] a
                u
                v
                w
            [bbbb] b
                i
                ii
                iii
                iv
        222
            a
            [aaaa] a
        333
            [D]
End
'''

REGULAR_TEXT = '''
Beer
    Historical
        Ale
            No hops
            Made by ale-wives or brewsters, mostly women
            Generally weak, drunk as an alternative to water
        Beer
            Hopped (but not hoppy)
            Concept brought in by Dutch brewers
            Comparatively strong
            Normally dark, before invention of pale malt and water treatment
    Modern
        Lager
            The most popular style currently, over 1,000,000,0000,000,000000 pints brewed every year
        Bitter
            Originally known as pale ale; the traditional English style, but suffers from an image problem
            3.8 - 4.5 % (ESB and similar up to 6%)
        IPA
            In England practically the same as pale ale, but in America a much stronger, hoppier brew; now being re-imported into Britain by craft brewers and the like (especially Marble, Kernel, Partizan, etc)
            The US is still the driver of the style
        Stout and porter
            Originally the same thing, porter died out (except for Fullers) but is now being experimented with by many brewers
            Guinness Foreign Export Stout is a survival of pre-WWI strength
        Minor styles
            Wild fermentations
                Especially in Belgium
                Lambic---the pure stuff
                Gueuze---a blend of old and young lambics
                Flanders sour ales
            Imperial X
            Weissbier
                Especially in Germany
                Dunkles Weizen
                Berliner Weisse
            Barley wine
            Top-fermented lager variants
                Kölsch
                Alt
            Eisbock
'''            



DECKJS_HEAD = '''
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="viewport" content="width=1024, user-scalable=no">
        <link rel="stylesheet" href="../deck.js/core/deck.core.css">
        <link rel="stylesheet" href="../deck.js/themes/style/web-2.0.css">
        <link rel="stylesheet" href="../deck.js/themes/transition/horizontal-slide.css">
        <script src="../deck.js/modernizr.custom.js"></script>
'''

DECKJS_BODY_FINAL = '''
        <script src="../deck.js/jquery-1.7.2.min.js"></script>
        <script src="../deck.js/core/deck.core.js"></script>
        <script>$(init());</script>
'''





@bottle.route('/deck.js/<path:path>')
def deck(path):
    return bottle.static_file(path, root=os.path.join(MY_PATH,'deck.js'))

@bottle.route('/css/<path:path>')
def css(path):
    return bottle.static_file(path, root=os.path.join(MY_PATH,'css'))

@bottle.route('/json/<name>')
def getJson(name):
    bottle.response.status = 200
    bottle.response.content_type = 'application/json'

    unroll = ((bottle.request.query.unroll!='') and int(bottle.request.query.unroll)) or None
    indent = ((bottle.request.query.indent!='') and int(bottle.request.query.indent)) or None

    thisSlide = slide.Slide.get(name)
    return thisSlide.json( unroll=unroll, indent=indent )

@bottle.route('/offline/<name>')
def getOffline(name):
    bottle.response.status = 200

    thisSlide = slide.Slide.get(name)
    json = thisSlide.json( unroll=None )

    cssLink = bottle.request.query.css or '/css/default.css'
    head = '''
        <link rel="stylesheet" href="%s"></link>
''' % cssLink

    script = '''

/* function from Zrajm C Akfohg,http://stackoverflow.com/questions/24816/escaping-html-strings-with-jquery */
escapeHTML = (function() {
    'use strict';
    var chr = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' };
    return function(text) {
        return text.replace(/[\"&<>]/g, function (a) { return chr[a]; });
    };
}());

get_link = function(id) {
    return ''+id;
};

get_slides = (function() {
    var undef = 'undefined';
    return function(defn, unroll) {
        var content;
        if (typeof defn.c === undef) {
            /* undefined means there is content but we don't know what it is yet */
            content = '<div id="'+defn.id+'">\\n<p><a href="'+get_link(defn.id)+'">'+escapeHTML(defn.n)+'</a></p>\\n</div>\\n';
        } else if (defn.c.length == 0) {
            /* zero length means there is definitely no content */
            content = '<div id="'+defn.id+'">\\n<p>'+escapeHTML(defn.n)+'</p>\\n</div>\\n';
        } else if (unroll == 0) {
            /* we have content but we're not going to unroll it */
            content = '<div id="'+defn.id+'">\\n<p><a href="'+get_link(defn.id)+'">'+escapeHTML(defn.n)+'</a></p>\\n</div>\\n';
        } else {
            content = '<div id="'+defn.id+'" class="slide">\\n<p><a href="'+get_link(defn.id)+'">'+escapeHTML(defn.n)+'</a></p><ul>\\n';
            for (var i=0; i<defn.c.length; i++) {
                content += '<li>'+get_slides( defn.c[i], unroll-1 )+'</li>\\n';
            }
            content += '</ul></div>\\n';
        }
        return content;
    };
}());

init = function() {
    INIT_DECK = %s;
    slideHtml = get_slides( INIT_DECK, 1 );
    for (var i=0; i<INIT_DECK.c.length; i++ ) {
        slideHtml += get_slides( INIT_DECK.c[i], 999 );
    }
    $('.deck-container').append(slideHtml);
    $.deck('.slide')
};
''' % json

    output = '''<html>
    <head>
        <title>Slides</title>
%s
%s
        <script>
%s
        </script>
    </head>
    <body id="body">
        <div class="deck-container">
        </div>
%s
    </body></html>
''' % (DECKJS_HEAD, head, script, DECKJS_BODY_FINAL)
    return output
    

@bottle.route('/slide/<name>')
def getSlide(name):
    bottle.response.status = 200

    cssLink = bottle.request.query.css or '/css/default.css'
    head = '''<link rel="stylesheet" href="%s"></link>
<script>init = function() { $.deck('.slide') };</script>
''' % cssLink

    unroll = ((bottle.request.query.unroll!='') and int(bottle.request.query.unroll)) or None
    lines = ((bottle.request.query.lines!='') and int(bottle.request.query.lines)) or None

    thisSlide = slide.Slide.get(name)
    body =  thisSlide.html(  unroll=unroll,
                             focus=bottle.request.query.focus,
                             css=bottle.request.query.css,
                             lines=lines,
                             trace=bottle.request.query.trace )

    output = '''<html>
    <head>
        <title>Slides</title>
%s
%s
    </head>
    <body id="body">
        <div class="deck-container">
%s
        </div>
%s
    </body></html>
''' % (DECKJS_HEAD, head, body, DECKJS_BODY_FINAL)
    return output


if __name__=='__main__':

    #thisSlide = slide.Slide.get('1')
    #print (thisSlide, slide.Slide.ALL)
    #print ( thisSlide.html( lines=10, focus='15' ) )

    slide.Slide.readText(REGULAR_TEXT)

    bottle.run()





OLD_DECK_SCRIPT='''
        <script type="text/javascript">

SHORTCUTS = {   prevLink: null,
                nextLink: null,
                inLink: null,
                outLink: null
            }

key = function(ev) {
    if (ev.keyCode == 37) { //left
        if (SHORTCUTS.prevLink) { window.location.href = SHORTCUTS.prevLink }
    } else if (ev.keyCode == 38) { //up
        if (SHORTCUTS.outLink) { window.location.href = SHORTCUTS.outLink }
    } else if (ev.keyCode == 39) { //right
        if (SHORTCUTS.nextLink) { window.location.href = SHORTCUTS.nextLink }
    } else if (ev.keyCode == 40) { //down
        if (SHORTCUTS.inLink) { window.location.href = SHORTCUTS.inLink }
    } else if (ev.keyCode == 32) { //space
        if (SHORTCUTS.inLink) { window.location.href = SHORTCUTS.inLink }
        else if (SHORTCUTS.nextLink) { window.location.href = SHORTCUTS.nextLink }
        else if (SHORTCUTS.outLink) { window.location.href = SHORTCUTS.outLink }
    }
}

init = function() {
    var prevLink = document.getElementById("prevLink");
    if (prevLink) { SHORTCUTS.prevLink = prevLink.getAttribute("href"); }
    var nextLink = document.getElementById("nextLink");
    if (nextLink) { SHORTCUTS.nextLink = nextLink.getAttribute("href"); }
    var inLink = document.getElementById("inLink");
    if (inLink) { SHORTCUTS.inLink = inLink.getAttribute("href"); }
    var outLink = document.getElementById("outLink");
    if (outLink) { SHORTCUTS.outLink = outLink.getAttribute("href"); }

    document.getElementById("body").onkeydown = key;
}

'''
