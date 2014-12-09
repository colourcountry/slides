#!/usr/bin/python3

import json,os

THEME_ROOT = 'themes'

STYLES = {
    None:               {                                                               'css': 'default/common.css'          },
    'text':             {                    'js': 'default/text.type.js',                                                   },
    'html':             { 'inherit': 'text', 'js': 'default/html.type.js'            },
    'note':             { 'inherit': 'html', 'js': 'default/note.type.js',              'css': 'default/note.type.css'       },
    'warning':          { 'inherit': 'html', 'js': 'default/warning.type.js',              'css': 'default/warning.type.css'       },
    'fallback':         { 'inherit': 'text', 'js': 'default/fallback.type.js'        },
    'incremental':      { 'inherit': 'html', 'js': 'default/incremental.type.js'     },
    'background':       { 'inherit': 'color','js': 'default/background.type.js',         'css': 'default/background.type.css'   },
    'transition':       { 'inherit': 'html', 'js': 'default/transition.type.js'      },
    'p':                { 'inherit': 'html', 'js': 'default/p.type.js'               },
    'ol':               { 'inherit': 'html', 'js': 'default/ol.type.js',                 'css': 'default/ol.type.css'        },
    'boxes':            { 'inherit': 'html', 'js': 'default/boxes.type.js',              'css': 'default/boxes.type.css'     },
    'bubbles':          { 'inherit': 'html', 'js': 'default/bubbles.type.js',            'css': 'default/bubbles.type.css'   },
    'image':            { 'inherit': 'text', 'js': 'default/image.type.js'           },
    'iframe':           { 'inherit': 'image','js': 'default/iframe.type.js'          },
    'subtitle':         { 'inherit': 'html', 'js': 'default/subtitle.type.js'        },
    'codeblock':        { 'inherit': 'text', 'js': 'default/codeblock.type.js'       },
    'color':            { 'inherit': 'text', 'js': 'default/color.type.js'           },
    'flash':            { 'inherit': 'html', 'js': 'default/flash.type.js',              'css': 'default/flash.type.css'   },
    'right':            { 'inherit': 'html', 'js': 'default/right.type.js'           },
    'left':             { 'inherit': 'html', 'js': 'default/left.type.js'            },
    'before':           { 'inherit': 'html', 'js': 'default/before.type.js'          },
    'after':            { 'inherit': 'html', 'js': 'default/after.type.js'           },
    'down-arrow':       { 'inherit': 'html', 'js': 'default/down-arrow.type.js'      },
    'grid':             { 'inherit': 'html', 'js': 'default/grid.type.js',               'css': 'default/grid.type.css'      },
    'nw':               { 'inherit': 'html', 'js': 'default/grid-nw.type.js'         },
    'ne':               { 'inherit': 'html', 'js': 'default/grid-ne.type.js'         },
    'sw':               { 'inherit': 'html', 'js': 'default/grid-sw.type.js'         },
    'se':               { 'inherit': 'html', 'js': 'default/grid-se.type.js'         },
    'y-axis':           { 'inherit': 'html', 'js': 'default/y-axis.type.js'          },
    'x-axis':           { 'inherit': 'html', 'js': 'default/x-axis.type.js'          },
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
                            # FIXME: this is nasty
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
var newProps = '''+self.js[style]+'''
for (var prop in newProps) {
    if (newProps.hasOwnProperty(prop)) {
        x.prototype[prop] = newProps[prop];
    }
}
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

