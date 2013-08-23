#!/usr/bin/python3

import os, re, sys, json, theme
import slide

MINIMIZE = False

THEME = theme.Theme()

def identity(x):
    return x

jsmin = cssmin = identity

if MINIMIZE:
    try:
        import rjsmin as mjsmin
        jsmin = mjsmin.jsmin
    except ImportError:
        sys.stderr.write("Couldn't import rjsmin, running without minimization")
    try:
        import cssmin as mcssmin
        cssmin = mcssmin.cssmin
    except ImportError:
        sys.stderr.write("Couldn't import cssmin, running without minimization")


HELPERS = open('helpers.js','r').read()
SLIDES = open('slides.js','r').read()
CORE = open('core.js','r').read()
TYPES = open('types.js','r').read()
CORE_CSS = open('core.css','r').read()
EDITOR_CSS = open('editor.css','r').read()
OVERVIEW_CSS = open('overview.css','r').read()
BODY = open('body.html','r').read()

ALL_CSS = ''
ALL_JS = HELPERS + SLIDES + CORE + TYPES

ALL_CSS += THEME.getCss(None)
for style in THEME.styles:
    ALL_CSS += THEME.getCss(style)
    ALL_JS += THEME.getJs(style)

ALL_CSS += CORE_CSS + EDITOR_CSS + OVERVIEW_CSS

MIN_CSS = cssmin(ALL_CSS)
MIN_JS = jsmin(ALL_JS)

def build(rootId, cacheJson, serverUrl):
    css = MIN_CSS
    js = MIN_JS

    body = BODY

    
    output = '''<!DOCTYPE html>
<html class="_view">
    <head>
        <meta charset="utf-8">
        <title id="title">Slides</title>
        <style id="styles">
%s
        </style>
        <script id="scripts">
%s
Pr.root_id = '%s';
Pr.std_body = '%s';
        </script>
        <script id="cache">
/* this cache was delivered from server */
Pr.server_url = %s;
Pr.cache = %s;
        </script>
    </head>
    %s
</html>
''' % (css, js, rootId, body.replace('\n',' '), json.dumps(serverUrl), cacheJson, body)
    return output
    





if __name__=='__main__':

    try:
        src = open(sys.argv[1],'r').read()
    except IndexError:
        src = open('demo.txt','r').read()

    slide.Slide.readText(src)
    root = slide.Slide.findRoot()

    print( build( root.id, root.json() ) )

