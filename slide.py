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
            # fullname (with key in brackets) specified
            return c_lass.ALL.get(match.group(1), default)
        else:
            # key or id specified
            return c_lass.ALL.get(name, default)

    @classmethod
    def getId(c_lass):
        global ID
        ID += 1
        return str(ID)

    @classmethod
    def findRoot(self):
        k,v = Slide.ALL.popitem()
        Slide.ALL[k]=v
        while v.parent:
            v = v.parent
        return v

    @classmethod
    def readText(c_lass, lines):
        curSlides=[]
        curIndent=[]
        for line in lines.split('\n'):
            newIndent = len(line) - len(line.lstrip())
            line = line.strip()
            if line:
                newSlide = None
                match = re.match('[[]([^]]+)[]](.*)', line)
                if match:
                    newSlide = Slide.get(match.group(1))
                if not newSlide:
                    newSlide = Slide(line=line)
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
        self.id = self.__class__.getId()
        self.setName( defn.get('line', 'Presentation') )
        self.content = []
        self.parent = None
        self.__class__.ALL[self.id] = self


    def setName(self, name):
        match = re.match('[[]([^]]+)[]] *(.*)', name)
        if match:
            key = match.group(1)
            if re.match('[0-9]+$',key):
                # Illegal key as contains only numbers
                niceName = name
                key = None
            else:
                if key in self.__class__.ALL:
                    raise ValueError('Slide with key %s already exists' % key)
                niceName = match.group(2)
        else:
            niceName = name
            key = None

        if hasattr(self, 'key'):
            self.__class__.ALL.pop(self.key)

        if key:
            self.key = key
            self.__class__.ALL[key] = self
        else:
            self.key = None

        match = re.match('([ a-z-]+): *(.*)', niceName)
        if match:
            self.style = match.group(1)
            niceName = match.group(2)
        else:
            self.style = None

        self.niceName = niceName

        self.name = name

    def add(self, slide):
        if not isinstance(slide, Slide):
            slide = self.__class__(line=slide)
        self.content.append(slide)
        slide.parent = self

    def __repr__(self):
        return '(%s/%s)%s:%s' % (self.id, self.key, self.style, self.niceName)


    def json(self, unroll=None):
        separators = (',', ':') # compact representation
        d = '{\n' # put each slide on its own line despite above
        for k, v in sorted(self.dict(unroll=unroll).items()):
            d += json.dumps(k)+':'+json.dumps(v, separators=separators)+',\n'
        return d[:-2]+'\n}\n'


    def dict(self, unroll=None):

        defn = { 'id': self.id, 'n': self.niceName, 'c':[child.id for child in self.content] }

        if self.parent:
            defn['p'] = self.parent.id

        if self.style:
            defn['s'] = self.style

        if self.key:
            defn['k'] = self.key

        result = { self.id: defn }

        if unroll is None or unroll>0:
            for child in self.content:
                if unroll is None:
                    result.update(child.dict(unroll=None))
                else:
                    result.update(child.dict(unroll=unroll-1))

        return result


    def styles(self, unroll=None):
        result = set()
        if self.style:
            result.add(self.style)

        if unroll is None or unroll>0:
            for child in self.content:
                if unroll is None:
                    result.update(child.styles(unroll=None))
                else:
                    result.update(child.styles(unroll=unroll-1))

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

        return (self.key or self.id) + (queries or '')

    def _html(self, element, level, unroll=None, focus=None, css=None, lines=None, trace=None, queries=None, prev=None, next=None, pastFocus=None):

        #print("Rendering %s at level %s with unroll %s, lines %s" % (self, level, unroll, lines))

        focused = (self.id == focus or self.key == focus)

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
        if self.key:
            ids += '''
    <span class="key">%s</span>''' % self.key

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
