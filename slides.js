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
    document.body.className = "_loaded";
    this.pr = pr;
    this.slides = Array.prototype.slice.call($$("section"));
    console.debug('init found '+this.slides.length+' slides: '+this.slides);

    this.progressBar = $("#progress-bar");
    this.html = $("html");
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
      || aEvent.metaKey) {
      return;
    }

    if (!this.html.classList.contains("_edit")) {

        if ( aEvent.keyCode == 37 // left arrow
          || aEvent.keyCode == 33 // page up
        ) {
          aEvent.preventDefault();
          this.back();
        } else
        if ( aEvent.keyCode == 39 // right arrow
          || aEvent.keyCode == 34 // page down
        ) {
          aEvent.preventDefault();
          this.forward();
        } else
        /*if (aEvent.keyCode == 38) { // up arrow*/
        if (aEvent.keyCode == 173 || aEvent.keyCode == 109 ) { // minus
          aEvent.preventDefault();
          this.out();
        } else
        /*if (aEvent.keyCode == 40) { // down arrow*/
        if (aEvent.keyCode == 61 || aEvent.keyCode == 107 ) { // plus
          aEvent.preventDefault();
          this.in();
        } else
        if (aEvent.keyCode == 35) { // end
          aEvent.preventDefault();
          this.goEnd();
        } else
        if (aEvent.keyCode == 36) { // home
          aEvent.preventDefault();
          this.goStart();
        } else
        /*
        if (aEvent.keyCode == 99999 ) { // ??
          aEvent.preventDefault();
          this.toggleContent();
        } else
        */
        if (aEvent.keyCode == 70) { // f
          aEvent.preventDefault();
          this.goFullscreen();
        } else
        if (aEvent.keyCode == 72) { // h
          aEvent.preventDefault();
          this.getHelp();
        } else
        if (aEvent.keyCode == 79 || aEvent.keyCode == 48) { // o 0
          aEvent.preventDefault();
          this.toggleView();
        } else
        if (aEvent.keyCode == 32) { // space
          aEvent.preventDefault();
          this.startPresentation();
        } else
        if (aEvent.keyCode == 82) { // r
          aEvent.preventDefault();
          this.goRandom();
        } else
        if (aEvent.keyCode == 27) { // escape
          aEvent.preventDefault();
          this.toggleEdit();
        } else {
          console.debug("Received unused keycode "+aEvent.keyCode);
        }

    } else {

        if (aEvent.keyCode == 27) { // escape
          aEvent.preventDefault();
          this.toggleEdit();
        } else {
          this.pr.handle_edit_key(aEvent);
        }

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
      orgY = aEvent.changedTouches[0].pageY;
    }

    function move(aEvent) {
      if (!tracking) return;
      var newX = aEvent.changedTouches[0].pageX;
      var newY = aEvent.changedTouches[0].pageY;
      if (orgX - newX > 100) {
        tracking = false;
        this.forward();
      } else
      if (orgX - newX < -100) {
        tracking = false;
        this.back();
      } else
      if (orgY - newY > 100) {
        tracking = false;
        this.out();
      } else
      if (orgY - newY < -100) {
          tracking = false;
          this.in();
      }
    }
  }

  Dz.setupView = function() {
    document.body.addEventListener("click", function ( e ) {
      if (!this.html.classList.contains("_view")) return;
      if (!e.target || e.target.nodeName != "SECTION") return;

      this.setCursor(e.target.getAttribute("id").substring(1));
    }.bind(this), false);
  }

  /* Adapt the size of the slides to the window */

  Dz.onresize = function() {
    console.log("onresize");
    var db = document.body;
    if (this.html.classList.contains("_view")) {
        var transform = "none";
    } else if (this.html.classList.contains("_edit")) {
        var transform = "none";
    } else {
        var sx = db.clientWidth / window.innerWidth;
        var sy = db.clientHeight / window.innerHeight;
        sx = 1600 / window.innerWidth;
        sy = 1200 / window.innerHeight;
        var scale = 1/Math.max(sx, sy);
        var transform = "scale3d(" + scale +","+scale+","+scale+")";
    }

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
    if (argv[0] === "RANDOM" && argc === 1)
      this.goRandom();
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
    // If the user changes the slide number in the URL bar, jump
    // to this slide.
    aStep = (aStep != 0 && typeof aStep !== "undefined") ? "." + aStep : ".0";
    console.debug("setCursor "+aId + aStep);
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
        newid = '1',
        newidx = 0,
        newstep = 0;
    if (cursor.length == 2) {
      newid = cursor[1].split(".")[0];
      newstep = ~~cursor[1].split(".")[1];
    }

    for (var i=0; i<this.slides.length; i++) {
        if (this.slides[i].getAttribute('id').slice(1) == newid) {
            newidx = i+1;
            console.debug("Going to slide with id "+newid);
        }
    }

    if (newidx == 0) {
        /* slide not found, maybe do something different here */
        console.log("No slide with id "+newid);
        newidx = 1;
    }

    $('#slide-count').innerHTML = newidx+'\u00a0of\u00a0'+this.slides.length;

    this.setProgress(newidx, newstep);
    this.setSlide(newidx);
    this.setIncremental(newstep);

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
                     this.slides[this.idx - 2].$$('._incremental > *').length);
    } else {
      this.setCursorByIndex(this.idx, this.step - 1);
    }
  }

  Dz.forward = function() {
    console.debug("forward");
    if (this.idx >= this.slides.length &&
        this.step >= this.slides[this.idx - 1].$$('._incremental > *').length) {
        /* ran out of slides, unroll as last resort */
        console.debug("Trying to expand last slide");
        this.in();
    } else if (this.step >= this.slides[this.idx - 1].$$('._incremental > *').length) {
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
    var lastStep = this.slides[lastIdx - 1].$$('._incremental > *').length;
    this.setCursorByIndex(lastIdx, lastStep);
  }

  Dz.goRandom = function() {
    var randIdx = this.idx;
    while (randIdx == this.idx) {
        var randIdx = Math.floor(Math.random()*this.slides.length) + 1;
    }
    console.debug("jump to "+randIdx+" from "+this.idx);
    this.setCursorByIndex(randIdx, 0);
  }

  Dz.toggleView = function() {
    this.html.classList.toggle("_view");
    this.onresize();
  }

  Dz.startPresentation = function() {
    if (this.html.classList.contains("_view")) {
        this.toggleView();
    } else {
        this.forward();
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
        old.removeAttribute("pr-parent");
        old = old.parentNode;
      }
    }
    if (next) {
      next.setAttribute("aria-selected", "true");
      var video = next.$("video");
      if (video && !!+this.params.autoplay) {
        video.play();
      }
      next = next.parentNode;
      next.scrollIntoView(); /* cheaty way of including border */
      while (next !== document) {
        next.setAttribute("pr-parent", "true");
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
    var old = this.slides[this.idx - 1].$('._incremental > *[aria-selected]');
    if (old) {
      old.removeAttribute('aria-selected');
    }
    var incrementals = $$('._incremental');
    if (this.step <= 0) {
      $$.forEach(incrementals, function(aNode) {
        aNode.removeAttribute('active');
      });
      return;
    }
    var next = this.slides[this.idx - 1].$$('._incremental > *')[this.step - 1];
    if (next) {
      next.setAttribute('aria-selected', true);
      next.parentNode.setAttribute('active', true);
      var found = false;
    /*
      $$.forEach(incrementals, function(aNode) {
        if (aNode != next.parentNode)
          if (found)
            aNode.removeAttribute('active');
          else
            aNode.setAttribute('active', true);
        else
          found = true;
      });
    */
    } else {
      this.setCursorByIndex(this.idx, 0);
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
    var steps = slide.$$('._incremental > *').length + 1,
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
    this.pr.update_save_url();

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

    console.debug('target '+target.id+' '+target.hasAttribute('pr-unroll')+' with '+deck_id.slice(1));

    if (target && target.hasAttribute('pr-unroll')) {


        this.pr.find_deck( deck_id.slice(1), function(deck) {
            if (typeof deck.c == 'undefined') {
                console.warn('children of '+deck.id+' not available');
            } else if (deck.c.length == 0 ) {
                console.warn(JSON.stringify(deck)+' has no children');
            } else {
                this.pr.unroll_deck( deck.id, function( deck ) {
                    var slide_html = this.pr.get_child_slides( deck.c, 0 );
                    target.innerHTML = slide_html;
                    target.removeAttribute('pr-unroll');
                    this.reinit();
                    if (typeof go_to == 'undefined') {
                        if (this.idx < this.slides.length) {
                            this.forward();
                        }
                    } else {
                        this.setCursor(go_to);
                    }
                }.bind(this));

            }
        }.bind(this));

    } else {
        /* Already unrolled */
        if (typeof go_to == 'undefined') {
            if (this.idx < this.slides.length) {
                this.forward();
            }
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
                target.setAttribute('pr-unroll','true');
                this.reinit();
                this.setCursor(parent.id,0);
            } else {
                /* not found in this deck, need to go up a level */
                window.location.href = parent_id
            }
        }.bind(this));
    }

};    

Dz.toggleEdit = function() {
    var deck_id = this.slides[this.idx-1].getAttribute('id').substring(1);
    this.html.classList.toggle("_edit");
    if (!this.html.classList.contains("_view")) {
        this.toggleView();
    }
    if (this.html.classList.contains("_edit")) {
        this.pr.show_editor(deck_id);
        this.onresize();
    } else {
        this.pr.hide_editor(deck_id, function(new_id) {
            console.debug("Reiniting with root id "+new_id);
            this.reinit();
            console.debug("Resetting hash to "+new_id);
            window.location.hash = "#" + new_id + ".0";
            this.onhashchange(); /* in case we were there already */
            this.onresize();
        }.bind(this));
    };
};

Dz.getHelp = function() {
    alert("Sorry, no help");
}
