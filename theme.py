#!/usr/bin/python3

import json,os

THEME_ROOT = 'themes'

STYLES = {
    None:               {                                                               'css': 'default/common.css'         },
    'text':             {                   'js': 'default/text.type.js',                                                   },
    'transition':       {'inherit': 'text', 'js': 'default/transition.type.js'      },
    'p':                {'inherit': 'text', 'js': 'default/p.type.js'               },
    'ol':               {'inherit': 'text', 'js': 'default/ol.type.js',                 'css': 'default/ol.type.css'        },
    'ol-incremental':   {'inherit': 'text', 'js': 'default/ol-incremental.type.js',     'css': 'default/ol.type.css'        },
    'boxes':            {'inherit': 'text', 'js': 'default/boxes.type.js',              'css': 'default/boxes.type.css'     },
    'bubbles':          {'inherit': 'text', 'js': 'default/bubbles.type.js',            'css': 'default/bubbles.type.css'   },
    'image':            {                   'js': 'default/image.type.js'           },
    'subtitle':         {                   'js': 'default/subtitle.type.js'        },
    'codeblock':        {                   'js': 'default/codeblock.type.js'       },
    'background-image': {                   'js': 'default/background-image.type.js'},
    'side-image':       {                   'js': 'default/side-image.type.js'      },
    'down-arrow':       {                   'js': 'default/down-arrow.type.js'      },
    'y-axis':           {                   'js': 'default/y-axis.type.js'          },
    'x-axis':           {                   'js': 'default/x-axis.type.js'          },
    'style':            {                   'js': 'default/style.type.js'           }
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
            return '''var x = function(pr, defn){ '''+inherit+'''.call(this, pr, defn); this.c_lass += " '''+style+'''"; };
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

