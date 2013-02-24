#!/usr/bin/python3

import os, sys, json
import slide
import bottle
bottle.debug(True)

MY_PATH = os.path.dirname(__file__)

sys.path.append(MY_PATH)


REGULAR_TEXT = '''
Presentable
    Building on tradition
        A slide deck is a prepared sequence of visuals
            Tools like PowerPoint reimplement older technologies (transparencies, OHP)
            Even Web-based slide frameworks (rvl.io, prezi.com) have the same heritage
        Preparation requires second-guessing your audience
            What do they already know?
            How much detail do they need?
            What views or visual aids will help them?
            What might they ask at the end?
        Coping strategies are ingrained
            Fleshing out slides with notes
            Adding extra "backup" slides at the end
    transition:We need to rediscover an earlier tradition
        background-image: http://placekitten.com/800/600
    transition:Press ↓ now!
        style: background-color: black
        subtitle: Or press → if you tried that already
        transition: You expanded the presentation to a deeper level of detail
            style: background-color: black
            Entries ending with … have more detail to explore
            Pressing ↑ removes the added slides and returns you to the higher level
            Press ↑ twice now and go back through the first section
    Presentation is really storytelling
        What does a storyteller do?
            Draws on a pool of knowledge
            Picks out a meaningful path
            Approaches the same topic in different ways
            Explores topics deeply, go off on tangents, skip sections
            Encourages the audience to ask questions
            Evolves the story through the telling
            Puts on a memorable event
        transition:So a presentation tool should be a storytelling aid
        What does a storytelling aid need?
            A pool of knowledge to draw from: a mind map
            An intuitive way to navigate the map
            The ability to switch between views of content
            Tight feedback loops with the audience
            Impactful presentation
    How Presentable does it
        Pool of knowledge
            Trivially simple structure
            Tree structure or mind map composed of entries
            Any text entry can have children
            Master set stored on server
            Pull off any subtree and save as a single HTML file
        Wayfinding
            Skip over subtrees
            Reorder children
            ?
        Alternative views
            A text entry + its children can be viewed as
                a list
                an ordered list
                a block diagram
                a pyramid
            A non-text entry may also have multiple views
            Swap between any of these views dynamically
        Feedback
            Draw down more information from the Net if online
            No need for "just in case" slides
            Edit slides during the performance
            Save from the browser
            Submit changes to an online repository
        Impact
            HTML5 browser provides presentation framework
            Display images, video
            Advanced styling for engaging appearance
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

@bottle.route('/extract/<name>')
def getJson(name):
    bottle.response.headers['Access-Control-Allow-Origin'] = '*'

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
