#!/usr/bin/python3

import os, re, sys, json
import slide
import presentation
import bottle
bottle.debug(True)

MY_PATH = os.path.dirname(__file__)
SERVER_URL = "http://localhost:8080"

sys.path.append(MY_PATH)

@bottle.route('/')
def getRoot(name):
    bottle.response.status = 200

    return '''<html>
<body>
    <h1>Presentable server</h1>
</body>
</html>
'''

@bottle.route('/extract/<name>')
def getJson(name):
    bottle.response.headers['Access-Control-Allow-Origin'] = '*'

    bottle.response.status = 200
    bottle.response.content_type = 'application/json'

    unroll = ((bottle.request.query.unroll!='') and int(bottle.request.query.unroll)) or None

    thisSlide = slide.Slide.get(name)
    return thisSlide.json( unroll=unroll )


@bottle.route('/offline/<name>')
def getOffline(name):
    bottle.response.status = 200

    unroll = ((bottle.request.query.unroll!='') and int(bottle.request.query.unroll)) or None

    thisSlide = slide.Slide.get(name)
    json = thisSlide.json( unroll=unroll )

    return presentation.build(name, json, SERVER_URL)


@bottle.route('/presentation/<name>')
def getSlides(name):
    bottle.response.status = 200

    return presentation.build(name, '{}', SERVER_URL)


# Older online system below.

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
    try:
        src = open(sys.argv[1],'r').read()
    except IndexError:
        src = open('demo.txt','r').read()
    slide.Slide.readText(src)
    bottle.run(host='0.0.0.0')
