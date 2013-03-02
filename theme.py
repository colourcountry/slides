#!/usr/bin/python3

import json,os

THEME_ROOT = 'themes'

STYLES = {
    None:               {                                                               'css': 'default/common.css'          },
    'text':             {                    'js': 'default/text.type.js',                                                   },
    'incremental':      { 'inherit': 'text', 'js': 'default/incremental.type.js'     },
    'background':       { 'inherit': 'color','js': 'default/background.type.js',         'css': 'default/background.type.css'   },
    'transition':       { 'inherit': 'text', 'js': 'default/transition.type.js'      },
    'p':                { 'inherit': 'text', 'js': 'default/p.type.js'               },
    'ol':               { 'inherit': 'text', 'js': 'default/ol.type.js',                 'css': 'default/ol.type.css'        },
    'boxes':            { 'inherit': 'text', 'js': 'default/boxes.type.js',              'css': 'default/boxes.type.css'     },
    'bubbles':          { 'inherit': 'text', 'js': 'default/bubbles.type.js',            'css': 'default/bubbles.type.css'   },
    'image':            { 'inherit': 'text', 'js': 'default/image.type.js'           },
    'subtitle':         { 'inherit': 'text', 'js': 'default/subtitle.type.js'        },
    'codeblock':        { 'inherit': 'text', 'js': 'default/codeblock.type.js'       },
    'color':            { 'inherit': 'text', 'js': 'default/color.type.js'           },
    'flash':            { 'inherit': 'text', 'js': 'default/flash.type.js',              'css': 'default/flash.type.css'   },
    'right':            { 'inherit': 'text', 'js': 'default/right.type.js'           },
    'left':             { 'inherit': 'text', 'js': 'default/left.type.js'            },
    'before':           { 'inherit': 'text', 'js': 'default/before.type.js'          },
    'after':            { 'inherit': 'text', 'js': 'default/after.type.js'           },
    'down-arrow':       { 'inherit': 'text', 'js': 'default/down-arrow.type.js'      },
    'grid':             { 'inherit': 'text', 'js': 'default/grid.type.js',               'css': 'default/grid.type.css'      },
    'nw':               { 'inherit': 'text', 'js': 'default/grid-nw.type.js'         },
    'ne':               { 'inherit': 'text', 'js': 'default/grid-ne.type.js'         },
    'sw':               { 'inherit': 'text', 'js': 'default/grid-sw.type.js'         },
    'se':               { 'inherit': 'text', 'js': 'default/grid-se.type.js'         },
    'y-axis':           { 'inherit': 'text', 'js': 'default/y-axis.type.js'          },
    'x-axis':           { 'inherit': 'text', 'js': 'default/x-axis.type.js'          },
    'style':            { 'inherit': 'text', 'js': 'default/style.type.js'           }
}

class Theme:
    def __init__(self):
        def getFile(filename):
            if filename:
                return open(filename, 'r').read()
            else:
                return ''

        self.styles = []
        self.js = {}
        self.css = {}
        self.inherit = {}

        while STYLES:
            for k,v in list(STYLES.items()):
                if 'inherit' not in v or v['inherit'] not in STYLES:
                    if 'js' in v:
                        self.js[k] = getFile(os.path.join(THEME_ROOT,v['js']))
                    if 'css' in v:
                        result = getFile(os.path.join(THEME_ROOT,v['css']))
                        if k is not None:
                            result = result.replace('.x', '.'+k)
                        self.css[k] = result
                    if 'inherit' in v:
                        self.inherit[k] = v['inherit']
                    self.styles.append(k)
                    STYLES.pop(k)


    def getJs(self,style):
        if style in self.inherit:
            inherit = 'Pr.types["'+self.inherit[style]+'"]'
        else:
            inherit = 'Ty'

        if style in self.js:
            return '''var x = function(pr, defn){ '''+inherit+'''.call(this, pr, defn); this.add_class("'''+style+'''"); };
x.prototype = new '''+inherit+'''();
'''+self.js[style]+'''
Pr.types["'''+style+'''"] = x;
'''
        else:
            print('No JS for style '+str(style))
            return ''

    def getCss(self,style):
        if style in self.css:
            return self.css.get(style,'')+'\n'
        else:
            print('No CSS for style '+str(style))
            return ''

