#!/usr/bin/python3

import os, sys, json
import slide
import bottle
bottle.debug(True)

sys.path.append(os.path.dirname(__file__))

@bottle.route('/css/<path>')
def css(path):
    return bottle.static_file(path, root='css')

@bottle.route('/slide/<name>')
def getSlide(name):
    bottle.response.status = 200

    cssLink = bottle.request.query.css or '/css/default.css'
    head = '<link rel="stylesheet" href="%s"></link>' % cssLink

    unroll = (bottle.request.query.unroll and int(bottle.request.query.unroll)) or None
    lines = (bottle.request.query.lines and int(bottle.request.query.lines)) or None

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
    slide.Slide.readText('''
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
''')

    #thisSlide = slide.Slide.get('1')
    #print (thisSlide, slide.Slide.ALL)
    #print ( thisSlide.html( lines=10, focus='15' ) )

    bottle.run()
