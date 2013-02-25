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


def build(rootId, json, styles):
    css = CORE_CSS;
    js = HELPERS + SLIDES + CORE + TYPES;
    styles.add('text')

    css += THEME.getCss(None)
    for style in THEME.styles:
        # FIXME: exclude unless required by inheritance
        css += THEME.getCss(style)
        js += THEME.getJs(style)

    output = '''<!DOCTYPE html>
<html>
    <head>
        <title>Slides</title>
        <style>
%s
        </style>
        <script>
%s
Pr.cache = %s;
Pr.root_id = "%s";
        </script>
    </head>
    <body id="body">
        <div id="slide-container"></div>
        <div id="progress-bar"></div>
    </body></html>
''' % (css, js, json, rootId)
    return output
    





if __name__=='__main__':

    try:
        src = open(sys.argv[1],'r').read()
    except IndexError:
        src = open('demo.txt','r').read()

    slide.Slide.readText(src)
    root = slide.Slide.findRoot()

    print( build( root.id, root.json(), root.styles() ) )
    
