#!/usr/bin/python3

import os, sys, json, re, urllib

DEBUG = True
ID = 0 

class OutOfSpaceException(Exception):
    pass

class Slide:
    FOCUSNOTFOUND = 0
    FOCUSFOUND = 1
    FOCUSUNROLLED = 2

    ALL={}

    @classmethod
    def get(c_lass, name, default=None):
        match = re.match('[[]([^]]+)[]](.*)', name)
        if match:
            # fullname (with shortname in brackets) specified
            return c_lass.ALL.get(match.group(1), default)
        else:
            # shortname or id specified
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
                match = re.match('[[]([^]]+)[]](.*)', line)
                if match:
                    newSlide = Slide.get(match.group(1), None) or Slide(name=line)
                else:
                    newSlide = Slide(name=line)
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
        self.id = self.__class__.getId()
        self.__class__.ALL[self.id] = self

    def setName(self, name):
        match = re.match('[[]([^]]+)[]](.*)', name)
        if match:
            shortName = match.group(1)
            if re.match('[0-9]+$',shortName):
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

        if hasattr(self, 'shortName'):
            self.__class__.ALL.pop(self.shortName)

        if shortName:
            self.shortName = shortName
            self.__class__.ALL[shortName] = self
        else:
            self.shortName = None

        self.niceName = niceName
        self.name = name

    def add(self, slide):
        if not isinstance(slide, Slide):
            slide = self.__class__(name=slide)
        self.content.append(slide)

    def __repr__(self):
        return '%s:%s:%s' % (self.id, self.shortName, self.niceName)


    def json(self, unroll=None, indent=None, separators=None):
        if separators is None:
            separators = (',', ':') # compact representation
        return json.dumps(self.dict(unroll=unroll), indent=indent, separators=separators)

    def dict(self, unroll=None):
        try:
            theId = int(self.id)
        except ValueError:
            theId = self.id

        result = { 'id': theId, 'n': self.name }
        if self.content:
            if unroll is None:
                result['c'] = [child.dict() for child in self.content]
            elif unroll>0:
                result['c'] = [child.dict(unroll=unroll-1) for child in self.content]
            else:
                pass # leave undefined
        else:
            # always let client know if a slide really is empty
            result['c'] = []
        return result
        

    def html(self, unroll=None, focus=None, css=None, lines=None, trace=None):
        queries = []
        if css: queries.append('css='+css)
        if lines: queries.append('lines='+str(lines))

        # trace for clickable links: add link back here
        thisTrace = self.getLink(focus=self.id,queries=queries)
        if trace:
            trace = urllib.parse.unquote(trace)
            thisTrace = '%s,%s' % (trace, thisTrace)

            if ',' in trace:
                oldTrace, latestTrace = trace.rsplit(',',1)
                if '?' in latestTrace:
                    outTrace = '%s&trace=%s' % (latestTrace,urllib.parse.quote(urllib.parse.quote(oldTrace)))
                else:
                    outTrace = '%s?trace=%s' % (latestTrace,urllib.parse.quote(urllib.parse.quote(oldTrace)))
            else:
                outTrace = trace

            outLink = '<a id="outLink" href="%s">Out</a>' % outTrace
        else:
            outLink = ''
            outTrace = None


        html, prev, next, pastFocus = self._html('div', 1, unroll, focus, css, lines, thisTrace, queries)

        if pastFocus == Slide.FOCUSNOTFOUND:
            # didn't find a focus, "next" will focus the root
            next = self
            prevLink = ''
            inLink = ''
            # trace for next/prev: no change
            nextLink = (next and ('<a id="nextLink" href="%s">Next</a>' % self.getLink(focus=next.id,trace=trace,queries=queries))) or 'Last slide'
        elif pastFocus == Slide.FOCUSUNROLLED:
            prevLink = (prev and ('<a id="prevLink" href="%s">Back</a>' % self.getLink(focus=prev.id,trace=trace,queries=queries))) or 'First slide'
            inLink = ''
            nextLink = (next and ('<a id="nextLink" href="%s">Next</a>' % self.getLink(focus=next.id,trace=trace,queries=queries))) or 'Last slide'
        else:
            # focus not unrolled, go into
            prevLink = (prev and ('<a id="prevLink" href="%s">Back</a>' % self.getLink(focus=prev.id,trace=trace,queries=queries))) or 'First slide'

            # trace for in: add next, unless there isn't one, in which case replace with current trace, unless, give up and add self
            if next:
                nextTrace = self.getLink(focus=next.id,queries=queries)
                if trace:
                    nextTrace = '%s,%s' % (trace, nextTrace)
            elif trace:
                nextTrace = trace
            else:
                nextTrace = thisTrace

            #print( str(next and self.getLink(focus=next.id,queries=queries)) +" "+str(trace)+" "+str(thisTrace) )

            inLink = '<a id="inLink" href="%s">In</a>' % pastFocus.getLink(focus=pastFocus.id,trace=nextTrace,queries=queries)

            nextLink = (next and ('<a id="nextLink" href="%s">Skip</a>' % self.getLink(focus=next.id,trace=trace,queries=queries))) or 'Last slide'

        links = '<div class="links">%s | %s | %s | %s</div>' % (prevLink, inLink, outLink, nextLink)

        return links+html
        
    def getLink(self, focus=None, trace=None, queries=None):
        if focus is None:
            focus = self.id
        focusQuery = ['focus=%s' % focus]

        if trace is None:
            traceQuery = []
        else:
            traceQuery = ['trace='+urllib.parse.quote(urllib.parse.quote(trace))]

        if queries is None:
            queries = []
        queries = '?'+'&'.join(queries+focusQuery+traceQuery)

        return (self.shortName or self.id) + (queries or '')

    def _html(self, element, level, unroll=None, focus=None, css=None, lines=None, trace=None, queries=None, prev=None, next=None, pastFocus=None):

        #print("Rendering %s at level %s with unroll %s, lines %s" % (self, level, unroll, lines))

        focused = (self.id == focus or self.shortName == focus)

        classAttr = 'slide'

        if focused:
            classAttr += ' focus'

        if self.content:
            classAttr += ' slide'

        if classAttr:
            classAttr = 'class="%s"' % classAttr

        div = '<%s %s id="%s">' % (element, classAttr, self.id)


        link = self.getLink(trace=trace,queries=queries)

        ids = '''
    <span class="id">%s</span>''' % self.id
        if self.shortName:
            ids += '''
    <span class="shortName">%s</span>''' % self.shortName

        heading = '''    <p>%s<a href="%s">%s</a></p>
''' % (ids, link, self.niceName)


        if pastFocus is None:
            pastFocus = Slide.FOCUSNOTFOUND

        if not focused:
            if pastFocus == Slide.FOCUSNOTFOUND:
                #print('Setting prev to %s' % self)
                prev = self
            else:
                if next is None:
                    #print('Setting next to %s (%s)' % (self, pastFocus))
                    next = self

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
                if focused:
                    #print("Found unrolled focus at %s" % self)
                    pastFocus = Slide.FOCUSUNROLLED


                if unroll > 1:
                    content = ''
                    subElement = 'section'
                else:
                    content = '<ul>'
                    subElement = 'li'

                for slide in self.content:
                    html, prev, next, pastFocus = slide._html(subElement, level+1, unroll, focus, css, None, trace, queries, prev, next, pastFocus)
                    content += html

                if unroll > 1:
                    pass
                else:
                    content += '</ul>'

            elif focused:
                # the focused entry has not been unrolled.
                #print("Found focus at %s" % self)
                pastFocus = self

        elif focused:
            # the focused entry has no children.
            pastFocus = Slide.FOCUSUNROLLED

        html = div + heading + content + ('</%s>' % element)

        return (html, prev, next, pastFocus)
