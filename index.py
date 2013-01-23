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
                             lines=lines )

    output = '''<html>
<body>
    <title>Slides</title>
    <head>
    %s
    </head>
    <body>
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
        2
            aa
        3
            aaa
            bbb
    C
        [] 11
        [22] 22
    D
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
            D
End
''')

    #thisSlide = slide.Slide.get('Presentation')
    #print ( thisSlide.html( lines=10, focus='[15]' ) )

    bottle.run()
