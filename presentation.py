#!/usr/bin/python3

import os, re, sys, json, theme
import slide

MINIMIZE = False

SERVER_URL = "http://localhost:8080"
THEME = theme.Theme()

def identity(x):
    return x

jsmin = cssmin = identity

if MINIMIZE:
    try:
        import rjsmin as mjsmin
        jsmin = mjsmin.jsmin
    except ImportError:
        pass
    try:
        import cssmin as mcssmin
        cssmin = mcssmin.cssmin
    except ImportError:
        pass


HELPERS = jsmin(open('helpers.js','r').read());
SLIDES = jsmin(open('slides.js','r').read());
CORE = jsmin(open('core.js','r').read());
TYPES = jsmin(open('types.js','r').read());
CORE_CSS = cssmin(open('core.css','r').read());

ALL_CSS = CORE_CSS
ALL_JS = HELPERS + SLIDES + CORE + TYPES;

ALL_CSS += THEME.getCss(None)
for style in THEME.styles:
    ALL_CSS += THEME.getCss(style)
    ALL_JS += THEME.getJs(style)



def build(rootId, cacheJson):
    css = ALL_CSS;
    js = ALL_JS;

    output = '''<!DOCTYPE html>
<html>
    <head>
        <title id="title">Slides</title>
        <style id="styles">
%s
        </style>
        <script id="scripts">
%s
Pr.root_id = "%s";
Pr.server_url = %s;
        </script>
        <script id="cache">
/* this cache was delivered from server */
Pr.cache = %s;
        </script>
    </head>
    <body id="body">
        <div id="slide-count"></div>
        <div id="save-button"><a href="#1.0">Save</a></div>
        <div id="slide-container"></div>
        <div id="progress-bar"></div>
    </body></html>
''' % (css, js, rootId, json.dumps(SERVER_URL), cacheJson)
    return output
    





if __name__=='__main__':

    try:
        src = open(sys.argv[1],'r').read()
    except IndexError:
        src = open('demo.txt','r').read()

    slide.Slide.readText(src)
    root = slide.Slide.findRoot()

    print( build( root.id, root.json() ) )

