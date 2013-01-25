#!/usr/bin/python3

import os, sys, json
import slide
import bottle
bottle.debug(True)

sys.path.append(os.path.dirname(__file__))

@bottle.route('/css/<path>')
def css(path):
    return bottle.static_file(path, root='css')

@bottle.route('/json/<name>')
def getJson(name):
    bottle.response.status = 200
    bottle.response.content_type = 'application/json'

    unroll = ((bottle.request.query.unroll!='') and int(bottle.request.query.unroll)) or None
    indent = ((bottle.request.query.indent!='') and int(bottle.request.query.indent)) or None

    thisSlide = slide.Slide.get(name)
    return thisSlide.json( unroll=unroll, indent=indent )


@bottle.route('/slide/<name>')
def getSlide(name):
    bottle.response.status = 200

    cssLink = bottle.request.query.css or '/css/default.css'
    head = '<link rel="stylesheet" href="%s"></link>' % cssLink

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

        </script>
    </head>
    <body id="body" onload="init()">
    %s
    </body></html>
''' % (head, body)
    return output


if __name__=='__main__':

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
            Originally known (as pale ale) The traditional English style, but suffers from an image problem
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

    #thisSlide = slide.Slide.get('1')
    #print (thisSlide, slide.Slide.ALL)
    #print ( thisSlide.html( lines=10, focus='15' ) )

    slide.Slide.readText(REGULAR_TEXT)
    bottle.run()
