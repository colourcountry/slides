/* Extended from dzslides.js by @paulrouget (paulrouget.com/dzslides/) */

  var Dz = {
    remoteWindows: [],
    idx: -1,
    step: 0,
    html: null,
    slides: null,
    progressBar : null,
    params: {
      autoplay: "1"
    },
    pr: null
  };

  Dz.init = function(pr) {
    document.body.className = "loaded";
    this.pr = pr;
    this.slides = Array.prototype.slice.call($$("section"));
    console.debug('init found '+this.slides.length+' slides: '+this.slides);

    this.progressBar = $("#progress-bar");
    this.html = document.body.parentNode;
    this.setupParams();
    this.goStart();
    this.onhashchange(); /* be synchronous on load */
    this.setupTouchEvents();
    this.onresize();
    this.setupView();
  }

  Dz.setupParams = function() {
    var p = window.location.search.substr(1).split('&');
    p.forEach(function(e, i, a) {
      var keyVal = e.split('=');
      Dz.params[keyVal[0]] = decodeURIComponent(keyVal[1]);
    });
  // Specific params handling
    if (!+this.params.autoplay)
      $$.forEach($$("video"), function(v){ v.controls = true });
  }

  Dz.onkeydown = function(aEvent) {
    // Don't intercept keyboard shortcuts
    if (aEvent.altKey
      || aEvent.ctrlKey
      || aEvent.metaKey
      || aEvent.shiftKey) {
      return;
    }
    if ( aEvent.keyCode == 37 // left arrow
      || aEvent.keyCode == 33 // page up
    ) {
      aEvent.preventDefault();
      this.back();
    }
    if ( aEvent.keyCode == 39 // right arrow
      || aEvent.keyCode == 34 // page down
    ) {
      aEvent.preventDefault();
      this.forward();
    }
    if (aEvent.keyCode == 38) { // up arrow
      aEvent.preventDefault();
      this.out();
    }
    if (aEvent.keyCode == 40) { // down arrow
      aEvent.preventDefault();
      this.in();
    }
    if (aEvent.keyCode == 35) { // end
      aEvent.preventDefault();
      this.goEnd();
    }
    if (aEvent.keyCode == 36) { // home
      aEvent.preventDefault();
      this.goStart();
    }
    if (aEvent.keyCode == 32) { // space
      aEvent.preventDefault();
      this.toggleContent();
    }
    if (aEvent.keyCode == 70) { // f
      aEvent.preventDefault();
      this.goFullscreen();
    }
    if (aEvent.keyCode == 79) { // o
      aEvent.preventDefault();
      this.toggleView();
    }
  }

  /* Touch Events */

  Dz.setupTouchEvents = function() {
    var orgX, newX;
    var tracking = false;

    var db = document.body;
    db.addEventListener("touchstart", start.bind(this), false);
    db.addEventListener("touchmove", move.bind(this), false);

    function start(aEvent) {
      aEvent.preventDefault();
      tracking = true;
      orgX = aEvent.changedTouches[0].pageX;
    }

    function move(aEvent) {
      if (!tracking) return;
      newX = aEvent.changedTouches[0].pageX;
      if (orgX - newX > 100) {
        tracking = false;
        this.forward();
      } else {
        if (orgX - newX < -100) {
          tracking = false;
          this.back();
        }
      }
    }
  }

  Dz.setupView = function() {
    document.body.addEventListener("click", function ( e ) {
      if (!Dz.html.classList.contains("view")) return;
      if (!e.target || e.target.nodeName != "SECTION") return;

      Dz.html.classList.remove("view");
      Dz.setCursor(e.getAttribute("id"));
    }, false);
  }

  /* Adapt the size of the slides to the window */

  Dz.onresize = function() {
    var db = document.body;
    var sx = db.clientWidth / window.innerWidth;
    var sy = db.clientHeight / window.innerHeight;
    sx = 800 / window.innerWidth;
    sy = 600 / window.innerHeight;
    var scale = 1/Math.max(sx, sy);
    var transform = "scale3d(" + scale +","+scale+","+scale+")";

    db.style.MozTransform = transform;
    db.style.WebkitTransform = transform;
    db.style.OTransform = transform;
    db.style.msTransform = transform;
    db.style.transform = transform;
  }


  Dz.getNotes = function(aIdx) {
    var s = this.slides[aIdx-1];
    var d = s.$("[role='note']");
    return d ? d.innerHTML : "";
  }

  Dz.onmessage = function(aEvent) {
    var argv = aEvent.data.split(" "), argc = argv.length;
    argv.forEach(function(e, i, a) { a[i] = decodeURIComponent(e) });
    var win = aEvent.source;
    if (argv[0] === "REGISTER" && argc === 1) {
      this.remoteWindows.push(win);
      this.postMsg(win, "REGISTERED", document.title, this.slides.length);
      this.postMsg(win, "CURSOR", this.idx + "." + this.step);
      return;
    }
    if (argv[0] === "BACK" && argc === 1)
      this.back();
    if (argv[0] === "FORWARD" && argc === 1)
      this.forward();
    if (argv[0] === "START" && argc === 1)
      this.goStart();
    if (argv[0] === "END" && argc === 1)
      this.goEnd();
    if (argv[0] === "TOGGLE_CONTENT" && argc === 1)
      this.toggleContent();
    if (argv[0] === "SET_CURSOR" && argc === 2)
      window.location.hash = "#" + argv[1];
    if (argv[0] === "GET_CURSOR" && argc === 1)
      this.postMsg(win, "CURSOR", this.idx + "." + this.step);
    if (argv[0] === "GET_NOTES" && argc === 1)
      this.postMsg(win, "NOTES", this.getNotes(this.idx));
  }

  Dz.toggleContent = function() {
    // If a Video is present in this new slide, play it.
    // If a Video is present in the previous slide, stop it.
    var s = $("section[aria-selected]");
    if (s) {
      var video = s.$("video");
      if (video) {
        if (video.ended || video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }
    }
  }

  Dz.setCursor = function(aId, aStep) {
    // If the user change the slide number in the URL bar, jump
    // to this slide.
    aStep = (aStep != 0 && typeof aStep !== "undefined") ? "." + aStep : ".0";
    window.location.hash = "#" + aId + aStep;
  }

  Dz.setCursorByIndex = function(aIdx, aStep) {
    var target = this.slides[aIdx-1];
    if (typeof target == 'undefined') {
        console.warn('No slide at index '+aIdx);
    } else {
        this.setCursor( target.getAttribute('id').slice(1), aStep );
    }
  }

  Dz.onhashchange = function() {
    var cursor = window.location.hash.split("#"),
        newid = 1,
        newidx = 0,
        newstep = 0;
    if (cursor.length == 2) {
      newid = ~~cursor[1].split(".")[0];
      newstep = ~~cursor[1].split(".")[1];
    }

    for (var i=0; i<this.slides.length; i++) {
        if (this.slides[i].getAttribute('id').slice(1) == newid) {
            newidx = i+1;
        }
    }

    if (newidx == 0) {
        /* slide not found, maybe do something different here */
        newidx = 1;
    }

    this.setProgress(newidx, newstep);
    if (newidx != this.idx) {
      this.setSlide(newidx);
    }
    if (newstep != this.step) {
      this.setIncremental(newstep);
    }
    for (var i = 0; i < this.remoteWindows.length; i++) {
      this.postMsg(this.remoteWindows[i], "CURSOR", this.idx + "." + this.step);
    }
  }

  Dz.back = function() {
    if (this.idx == 1 && this.step == 0) {
      return;
    }
    if (this.step == 0) {
      this.setCursorByIndex(this.idx - 1,
                     this.slides[this.idx - 2].$$('.incremental > *').length);
    } else {
      this.setCursorByIndex(this.idx, this.step - 1);
    }
  }

  Dz.forward = function() {
    if (this.idx >= this.slides.length &&
        this.step >= this.slides[this.idx - 1].$$('.incremental > *').length) {
        return;
    }
    if (this.step >= this.slides[this.idx - 1].$$('.incremental > *').length) {
      this.setCursorByIndex(this.idx + 1, 0);
    } else {
      this.setCursorByIndex(this.idx, this.step + 1);
    }
  }

  Dz.goStart = function() {
    this.setCursorByIndex(1, 0);
  }

  Dz.goEnd = function() {
    var lastIdx = this.slides.length;
    var lastStep = this.slides[lastIdx - 1].$$('.incremental > *').length;
    this.setCursorByIndex(lastIdx - 1, lastStep);
  }

  Dz.toggleView = function() {
    this.html.classList.toggle("view");

    if (this.html.classList.contains("view")) {
      $("section[aria-selected]").scrollIntoView(true);
    }
  }

  Dz.setSlide = function(aIdx) {
    var old = this.slides[this.idx-1];
    this.idx = aIdx;
    var next = this.slides[this.idx-1];
    if (old) {
      old.removeAttribute("aria-selected");
      var video = old.$("video");
      if (video) {
        video.pause();
      }
      old = old.parentNode;
      while (old !== document) {
        old.removeAttribute("aria-parent");
        old = old.parentNode;
      }
    }
    if (next) {
      next.setAttribute("aria-selected", "true");
      if (this.html.classList.contains("view")) {
        next.scrollIntoView();
      }
      var video = next.$("video");
      if (video && !!+this.params.autoplay) {
        video.play();
      }
      next = next.parentNode;
      while (next !== document) {
        next.setAttribute("aria-parent", "true");
        next = next.parentNode;
      }
    } else {
      // That should not happen
      this.idx = -1;
      console.warn("Slide "+aIdx+" didn't exist.");
    }
  }

  Dz.setIncremental = function(aStep) {
    this.step = aStep;
    var old = this.slides[this.idx - 1].$('.incremental > *[aria-selected]');
    if (old) {
      old.removeAttribute('aria-selected');
    }
    var incrementals = $$('.incremental');
    if (this.step <= 0) {
      $$.forEach(incrementals, function(aNode) {
        aNode.removeAttribute('active');
      });
      return;
    }
    var next = this.slides[this.idx - 1].$$('.incremental > *')[this.step - 1];
    if (next) {
      next.setAttribute('aria-selected', true);
      next.parentNode.setAttribute('active', true);
      var found = false;
      $$.forEach(incrementals, function(aNode) {
        if (aNode != next.parentNode)
          if (found)
            aNode.removeAttribute('active');
          else
            aNode.setAttribute('active', true);
        else
          found = true;
      });
    } else {
      setCursorByIndex(this.idx, 0);
    }
    return next;
  }

  Dz.goFullscreen = function() {
    var html = $('html'),
        requestFullscreen = html.requestFullscreen || html.requestFullScreen || html.mozRequestFullScreen || html.webkitRequestFullScreen;
    if (requestFullscreen) {
      requestFullscreen.apply(html);
    }
  }
  
  Dz.setProgress = function(aIdx, aStep) {
    var slide = this.slides[aIdx-1];
    var steps = slide.$$('.incremental > *').length + 1,
        slideSize = 100 / (this.slides.length - 1),
        stepSize = slideSize / steps;
    this.progressBar.style.width = ((aIdx - 1) * slideSize + aStep * stepSize) + '%';
  }
  
  Dz.postMsg = function(aWin, aMsg) { // [arg0, [arg1...]]
    aMsg = [aMsg];
    for (var i = 2; i < arguments.length; i++)
      aMsg.push(encodeURIComponent(arguments[i]));
    aWin.postMessage(aMsg.join(" "), "*");
  }
  

Dz.reinit = function() {
    console.debug('reinit old index '+this.idx+' of '+this.slides);
    var cur_slide = this.slides[this.idx-1];

    this.slides = Array.prototype.slice.call($$("section"));
    console.debug('reinit found '+this.slides.length+' slides: '+this.slides);

    for (var i=0; i<this.slides.length; i++) {
        if (this.slides[i].getAttribute('id') == cur_slide.getAttribute('id')) {
            this.idx = i+1;
            return;
        }
    }
}


Dz.in = function(go_to) {
    console.debug('unrolling to '+go_to);

    var deck_id = this.slides[this.idx-1].getAttribute('id');
    var target = $('#c'+deck_id);

    if (target && target.hasAttribute('aria-unroll')) {

        this.pr.find_deck( deck_id.slice(1), function(deck) {
            if (typeof deck.c == 'undefined') {
                console.warn('children of '+deck.id+' not available');
            } else if (deck.c.length == 0 ) {
                console.warn(JSON.stringify(deck)+' has no children');
            } else {

                this.pr.unroll_deck( deck.id, function( deck ) {
                    var slide_html = this.pr.get_child_slides( deck.c, 0 );
                    target.innerHTML = slide_html;
                    target.removeAttribute('aria-unroll');
                    this.reinit();
                    if (typeof go_to == 'undefined') {
                        this.forward();
                    } else {
                        this.setCursor(go_to);
                    }
                }.bind(this));

            }
        }.bind(this));

    } else {
        /* Already unrolled */
        if (typeof go_to == 'undefined') {
           this.forward();
        } else {
           this.setCursor(go_to);
        }
    }
};

Dz.out = function() {

    var deck_id = this.slides[this.idx-1].getAttribute('id');
    var parent_id = this.pr.cache[deck_id.slice(1)].p

    if ( typeof parent_id != 'undefined' ) {
        var parent = this.pr.find_deck( parent_id, function(parent) {
            var target = $('#cs'+parent.id);
            if (target) {
                target.innerHTML = '';
                target.setAttribute('aria-unroll','true');
                this.reinit();
                this.setCursor(parent.id,0);
            } else {
                /* not found in this deck, need to go up a level */
                window.location.href = parent_id
            }
        }.bind(this));
    }

};    
