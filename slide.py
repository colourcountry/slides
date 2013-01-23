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
        queries = '?'+'&'.join(queries)

        return self._html('div', 1, unroll, focus, css, lines, queries)

    def _html(self, element, level, unroll=None, focus=None, css=None, lines=None, queries=None):
        print("Rendering %s at level %s with unroll %s, lines %s" % (self.name, level, unroll, lines))

        div = '<%s id="%s">' % (element, self.id)

        if self.id == focus or self.name == focus:
            focusAttr = 'class="focus"'
        else:
            focusAttr = ''


        link = (self.shortName or self.id) + (queries or '')

        ids = '''
    <span class="id">%s</span>''' % self.id
        if self.shortName:
            ids += '''
    <span class="shortName">%s</span>''' % self.shortName

        heading = '''<h%d %s>%s
    <a href="%s">%s</a>
</h%d>''' % (level, focusAttr, ids, link, self.niceName, level)


        content = ''
        if self.content and (unroll is None or unroll>0):
            if lines is not None:
                # find the unroll level which will fit in the specified number of lines
                newUnroll = -1
                slidesToUnroll=[self]
                while slidesToUnroll and len(slidesToUnroll) <= lines:
                    lines -= len(slidesToUnroll)
                    unrolled = []
                    for slide in slidesToUnroll:
                        unrolled.extend(slide.content)
                    newUnroll += 1
                    slidesToUnroll = unrolled

                if newUnroll == 0:
                    # not enough space for immediate children, paging will be required
                    raise OutOfSpaceException
                    

            elif unroll is not None:
                newUnroll = unroll-1

            else:
                # if not told to unroll, don't
                newUnroll = 0

            if newUnroll > 0:
                content = '<ul>'
                for slide in self.content:
                    content += slide._html('li', level+1, newUnroll, focus, css, None, queries)
                content += '</ul>'

        return div + heading + content + ('</%s>' % element)
