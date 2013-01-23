#!/usr/bin/python3

import os, sys, json, re

DEBUG = True
ID = 0 

class OutOfSpaceException(Exception):
    pass

class Slide:
    ALL={}

    @classmethod
    def get(c_lass, name, default=None):
        return c_lass.ALL.get(name, default)

    @classmethod
    def getId(c_lass):
        global ID
        ID += 1
        return str(ID)
    
    @classmethod
    def readText(c_lass, lines):
        curSlides=[]
        curIndent=[]
        for line in lines.split('\n'):
            newIndent = len(line) - len(line.lstrip())
            line = line.strip()
            if line:
                newSlide = Slide.get(line, None) or Slide(name=line)
                if not curSlides:
                    firstSlide = newSlide
                    curSlides.append(newSlide)
                    curIndent.append(newIndent)
                elif newIndent > curIndent[-1]:
                    curSlides.append(newSlide)
                    curIndent.append(newIndent)
                elif newIndent == curIndent[-1]:
                    curSlides[-1] = newSlide
                else:
                    while curIndent[-1] != newIndent:
                        curIndent.pop()
                        curSlides.pop()
                    curSlides[-1] = newSlide
                if len(curSlides)>1:
                    curSlides[-2].add(newSlide)
        return firstSlide

    def __init__(self, **defn):
        self.setName( defn.get('name', 'Presentation') )
        self.content = []
        self.id = '['+self.__class__.getId()+']'
        self.__class__.ALL[self.id] = self

    def setName(self, name):
        if name in self.__class__.ALL:
            raise ValueError('Slide %s already exists' % name)

        match = re.match('([[][^]]+[]])(.*)', name)
        if match:
            shortName = match.group(1)
            if re.match('[[][0-9]+[]]',shortName):
                # Illegal shortname as contains only numbers
                niceName = name
                shortName = None
            else:
                if shortName in self.__class__.ALL:
                    raise ValueError('Slide with short name %s already exists' % shortName)
                niceName = match.group(2)
        else:
            niceName = name
            shortName = None

        if hasattr(self, 'name'):
            self.__class__.ALL.pop(self.name)
        if hasattr(self, 'shortName'):
            self.__class__.ALL.pop(self.shortName)

        self.name = name
        self.__class__.ALL[name] = self

        if shortName:
            self.shortName = shortName
            self.__class__.ALL[shortName] = self
        else:
            self.shortName = None

        self.niceName = niceName

    def add(self, slide):
        if not isinstance(slide, Slide):
            slide = self.__class__(name=slide)
        self.content.append(slide)

    def __repr__(self):
        return '%s:%s:%s' % (self.id, self.shortName, self.niceName)


    def html(self, unroll=None, focus=None, css=None, lines=None):
        queries = []
        if css: queries.append('css='+css)
        if lines: queries.append('lines='+str(lines))

        html, prev, next, pastFocus = self._html('div', 1, unroll, focus, css, lines, queries)

        if not pastFocus:
            # didn't find a focus, "next" will focus the root
            next = self

        prevLink = (prev and ('<a href="%s">Back</a>' % self.getLink(focus=prev.id,queries=queries))) or 'First slide'
        nextLink = (next and ('<a href="%s">Next</a>' % self.getLink(focus=next.id,queries=queries))) or 'Last slide'
        links = '<div class="links">%s %s</div>' % (prevLink, nextLink)

        return links+html
        
    def getLink(self, focus=None, queries=None):
        if focus is None:
            focus = self.id
        focusQuery = ['focus='+focus]
        if queries is None:
            queries = []
        queries = '?'+'&'.join(queries+focusQuery)
        return (self.shortName or self.id) + (queries or '')

    def _html(self, element, level, unroll=None, focus=None, css=None, lines=None, queries=None, prev=None, next=None, pastFocus=False):
        print("Rendering %s at level %s with unroll %s, lines %s" % (self.name, level, unroll, lines))

        div = '<%s id="%s">' % (element, self.id)

        focused = (self.id == focus or self.name == focus)

        if focused:
            focusAttr = 'class="focus"'
        else:
            focusAttr = ''

        link = self.getLink(queries=queries)

        ids = '''
    <span class="id">%s</span>''' % self.id
        if self.shortName:
            ids += '''
    <span class="shortName">%s</span>''' % self.shortName

        heading = '''<h%d %s>%s
    <a href="%s">%s</a>
</h%d>''' % (level, focusAttr, ids, link, self.niceName, level)


        if pastFocus:
            if next is None: next = self
        else:
            if focused:
                pastFocus = True
            else:
                prev = self

        content = ''
        if self.content:
            if lines is not None:
                # find the unroll level which will fit in the specified number of lines
                unroll = -1
                slidesToUnroll=[self]
                while slidesToUnroll and len(slidesToUnroll) <= lines:
                    lines -= len(slidesToUnroll)
                    unrolled = []
                    for slide in slidesToUnroll:
                        unrolled.extend(slide.content)
                    unroll += 1
                    slidesToUnroll = unrolled

                if unroll == 0:
                    # not enough space for immediate children, paging will be required
                    raise OutOfSpaceException
                    

            elif unroll is not None:
                unroll -= 1

            else:
                # if not told to unroll, don't
                unroll = 0

            if unroll > 0:
                content = '<ul>'
                for slide in self.content:
                    html, prev, next, pastFocus = slide._html('li', level+1, unroll, focus, css, None, queries, prev, next, pastFocus)
                    content += html
                content += '</ul>'

        html = div + heading + content + ('</%s>' % element)

        return (html, prev, next, pastFocus)
