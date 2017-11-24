var Player = (function() {
  const PLAYER_CONTROL_TIME = 5000;

  function createComp(ele, className, id) {
    const div = document.createElement(ele);
    if (className) div.setAttribute("class", className);
    if (id) div.setAttribute("id", id);
    return div;
  }

  function Player(options) {
    options = options || {};

    this.audio = null;
    this.playing = false;
    this.currentTime = 0;
    this.playerContent = options.playerContent
      ? document.getElementById(options.playerContent)
      : document.body;

    this.playerContent.addEventListener(
      "mouseover",
      this.showPlayerControl.bind(this)
    );

    this.canvasPlayer = options.canvasPlayer || false;

    this.createPlayer();
    this.listenEvent();
    this.onClose = options.onClose;
    this.onRewind = options.onRewind;
    this.onForward = options.onForward;

    if (options.source) this.setSource(options.source);
  }

  Player.prototype.hidePlayerControl = function() {
    if (this.playerControl && this.playing)
      this.playerControl.style.display = "none";
  };
  Player.prototype.showPlayerControl = function() {
    if (this.playerControl) {
      clearTimeout(this.playerControlTimeout);
      this.playerControl.style.display = "block";
      this.playerControlTimeout = setTimeout(
        this.hidePlayerControl.bind(this),
        PLAYER_CONTROL_TIME
      );
    }
  };

  Player.prototype.createPlayer = function() {
    const self = this;
    const now = Date.now();
    this.playerControl = createComp("div", "player-controls");
    this.subTitleContent = createComp("div", "player-subtitle-content");

    this.video = createComp("video", null, "video" + now);
    this.video.setAttribute("autobuffer", true);

    this.closeButton = createComp("div", "close-button");
    this.closeButton.appendChild(createComp("i", "icono-caretLeftCircle"));
    this.closeButton.addEventListener("click", function() {
      self.onClose();
    });

    this.canvas = createComp("canvas", null, "canvas" + now);
    this.canvas.setAttribute("moz-opaque", "true");

    if (this.canvasPlayer) this.video.style.display = "none";
    this.ctx = this.canvas.getContext("2d");
    this.setCanvasSize();
    this.createProgressBar();
    this.createControls();

    this.video.appendChild(createComp("source"));

    this.playerContent.appendChild(this.video);
    this.playerContent.appendChild(this.canvas);

    this.playerContent.appendChild(this.subTitleContent);
    this.playerContent.appendChild(this.playerControl);
    this.playerContent.appendChild(this.closeButton);

    this.playerControlTimeout = setTimeout(
      this.hidePlayerControl.bind(this),
      PLAYER_CONTROL_TIME
    );
  };

  Player.prototype.createProgressBar = function() {
    const self = this;

    const playerContentTime = createComp("div", "player-content-time");
    const progressContent = createComp("div", "player-progress-content");
    this.timeInterface = createComp("div", "player-time");

    const progressBall = createComp("div", "player-progress-ball");
    this.progressBar = createComp("div", "player-progress-bar");

    progressContent.addEventListener("click", function(e) {
      const offset = e.pageX - self.playerContent.clientWidth * 0.05;
      const percentage = offset / progressContent.offsetWidth;
      self.jumpTo(percentage);
    });

    this.progressBar.appendChild(progressBall);
    progressContent.appendChild(this.progressBar);

    playerContentTime.appendChild(progressContent);
    playerContentTime.appendChild(this.timeInterface);

    this.playerControl.appendChild(playerContentTime);
  };

  Player.prototype.createControls = function() {
    const self = this;
    const buttonsContent = createComp("div", "player-button-content");
    this.playButton = createComp("div");
    this.playButton.appendChild(createComp("i", "icono-play"));

    this.rewindButton = createComp("div");
    this.rewindButton.appendChild(createComp("i", "icono-rewind"));

    this.forwardButton = createComp("div");
    this.forwardButton.appendChild(createComp("i", "icono-forward"));

    this.playButton.addEventListener("click", function() {
      const child = self.playButton.firstElementChild;
      if (child.getAttribute("class") == "icono-play") {
        self.play();
        child.setAttribute("class", "icono-pause");
      } else {
        self.pause();
        child.setAttribute("class", "icono-play");
      }
    });

    this.rewindButton.addEventListener("click", function() {
      self.onRewind();
    });
    this.forwardButton.addEventListener("click", function() {
      self.onForward();
    });

    buttonsContent.appendChild(this.rewindButton);
    buttonsContent.appendChild(this.playButton);
    buttonsContent.appendChild(this.forwardButton);

    this.playerControl.appendChild(buttonsContent);
  };

  Player.prototype.jumpTo = function(porcent) {
    const time = this.audio.duration * porcent;
    this.currentTime = time;
    this.audio.currentTime = time;
    this.video.currentTime = this.video.duration * porcent;
    if (!this.playing) this.play();
  };

  Player.prototype.setCanvasSize = function() {
    this.width = document.body.clientWidth;
    this.height = document.body.clientHeight;

    if (this.canvasPlayer) {
      this.canvas.setAttribute("width", this.width);
      this.canvas.setAttribute("height", this.height);
    } else {
      this.video.setAttribute("width", this.width);
      this.video.setAttribute("height", this.height);
    }
  };

  Player.prototype.getTimeToView = function() {
    let date = new Date(null);
    date.setSeconds(this.audio.duration - this.currentTime);

    let _minute = isNaN(date.getMinutes()) ? "0" : date.getMinutes();
    let _second = isNaN(date.getSeconds()) ? "0" : date.getSeconds();
    let m = _minute > 9 ? _minute : "0" + _minute;
    let s = _second > 9 ? _second : "0" + _second;

    return m + ":" + s;
  };

  Player.prototype.updatePregressBar = function() {
    const percentTime = this.currentTime * 100 / this.audio.duration;
    this.progressBar.style.width = percentTime + "%";
    this.timeInterface.innerText = this.getTimeToView();
  };

  Player.prototype.listenEvent = function() {
    const self = this;

    window.addEventListener("resize", function() {
      if (self.timeResize) clearInterval(self.timeResize);
      self.timeResize = setTimeout(self.setCanvasSize.bind(self), 100);
    });

    this.video.addEventListener("waiting", function() {
      self.audio && self.audio.pause();
    });

    this.video.addEventListener("playing", function() {
      self.audio && self.audio.play();
    });

    if (this.audio) {
      this.audio.addEventListener("waiting", function() {
        self.video.pause();
      });

      this.audio.addEventListener("playing", function() {
        self.video.play();
      });
    }

    if (this.canvasPlayer) {
      this.video.addEventListener("timeupdate", function() {
        self.drawFrame();
      });

      this.video.addEventListener("canplay", function() {
        self.drawFrame();
      });
    }
  };

  Player.prototype.cleanListeners = function() {};

  Player.prototype.loop = function() {
    const self = this;
    const time = Date.now();
    const elapsed = (time - this.lastTime) / 1000;
    const audioTime = this.audio.currentTime.toFixed(1);
    const subTime = this.subtitles.length ? this.subtitles[0].time : null;

    if (subTime == audioTime) {
      this.subTitleContent.innerText = this.subtitles[0].txt;
      this.subtitles.shift();
    }

    if (elapsed >= 1) {
      this.lastTime = time;

      if (this.currentTime !== this.audio.currentTime) {
        this.currentTime = this.audio.currentTime;
        this.updatePregressBar();
      }
    }

    if (this.video.ended && this.audio && !this.audio.ended) this.video.play();
    if (this.audio && this.audio.ended) this.pause();

    if (this.playing) {
      this.animationFrame = requestAnimationFrame(function() {
        self.loop();
      });
    }
  };

  Player.prototype.pause = function(source) {
    this.video.pause();
    this.audio.pause();
    this.playing = false;
    cancelAnimationFrame(this.animationFrame);
  };

  Player.prototype.play = function(source) {
    if (source) this.setSource(source);
    else if (!this.source) throw "Erro, you need set the source parameter";

    if (this.playButton)
      this.playButton.firstElementChild.setAttribute("class", "icono-pause");

    this.lastTime = Date.now();
    this.playing = true;
    this.timeInterface.innerText = this.getTimeToView();

    this.video.play();
    if (this.audio) this.audio.play();
    this.loop();
  };

  Player.prototype.setSource = function(source) {
    this.source = source;
    this.subtitles = source.subtitles || [];
    this.video.firstElementChild.setAttribute("src", source.video);
    this.video.load();

    this.subTitleContent.innerText = "";
    this.progressBar.style.width = 0 + "%";

    if (source.audio) {
      if (this.source && this.source.title) {
        const comp = document.getElementsByClassName("player-title")[0];
        const videoTitle = comp || createComp("div", "player-title");

        if (comp) {
          videoTitle.innerText = this.source.title;
        } else {
          videoTitle.append(this.source.title);
          document
            .getElementsByClassName("player-button-content")[0]
            .appendChild(videoTitle);
        }
      }

      if (this.audio) {
        this.audio.setAttribute("src", source.audio);
      } else {
        this.audio = document.createElement("audio");
        this.audio.setAttribute("src", source.audio);
        this.playerContent.appendChild(this.audio);
      }

      this.audio.load();
    }
  };

  Player.prototype.drawFrame = function() {
    if (this.playing) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
    }
  };

  return Player;
})();
