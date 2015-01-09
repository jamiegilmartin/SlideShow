'use strict'; 

define('slideshow', [],function(){

    /**
    * Minimum distance required before a touch is considered a swipe 
    * @type {number}
    */
    var MIN_DELTA_FOR_SWIPE = 40;
    /**
    * Maximum time in milliseconds before a drag event is no longer considered a swipe
    * @type {number}
    */
    var MAX_TIME_FOR_SWIPE = 200;

    /**
     * @Class SlideShow
     * @author jamiegilmartin@gmail.com
     * @param options
     */
    var SlideShow = function( options ){
        if(!options) return;

        this.view = options.view;
        this.duration = options.duration;
        this.delay = 3000;
        this.isFullScreen = options.fullscreen;
        this.transitioning = false;
        this.playing = options.looping;
        
        this.init();
        this.events();
        if(this.playing) this.startLoop();
    };
    SlideShow.prototype.init = function(){
        this.isMobile = /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
        this.isAndroid = /Android/i.test(navigator.userAgent);
        //alert('isAn '+this.isMobile +' '+ this.isAndroid)
        //this.dragStartEvent = this.isMobile ? 'touchstart' : 'mousedown';
        //this.dragMoveEvent  = this.isMobile ? 'touchmove' : 'mousemove';
        //this.dragEndEvent  = this.isMobile ? 'touchend' : 'mouseup';
        this.clickEvent = this.isMobile ? 'touchend' : 'click';
        
        
        //find parts of SlideShow in dom, children of view
        this.list = this.view.getElementsByTagName('ul')[0];
        this.slides = this.list.querySelectorAll('li');

        //build
        this.build();
        
        this.active_index = 0;
        //set dimensions
        this.setDimensions();
        
        this.slideWidth = this.slides[0].offsetWidth;//this assumes slides are all the same width
        this.viewWidth = this.view.offsetWidth;
        this.viewHeight = this.view.offsetHeight;
        
        this.update();
        
    };

    SlideShow.prototype.build = function(){
        var self = this;

        //btns
        this.nextBtn = document.createElement('div');
        this.nextBtn.classList.add('next');
        this.nextBtn.innerHTML = "next";
        this.prevBtn = document.createElement('div');
        this.prevBtn.classList.add('prev');
        this.prevBtn.innerHTML = "prev";


        this.view.appendChild(this.nextBtn);
        this.view.appendChild(this.prevBtn);

        //indicator
        this.indicator = document.createElement('div');
        this.indicator.classList.add('indicator');
        this.indicatorList = document.createElement('ol');
        
        //indicator item helper class
        function indicatorItem(index){
            var li = document.createElement('li');
            li.innerHTML = index;
            li.addEventListener( self.clickEvent,function(e){
                e.preventDefault();
                self.playing = false;
                self.gotoSlide(index+1);
            },false);
            return li;
        }
        
        //loop by slides length
        for(var i=0;i<this.slides.length;i++){
            this.indicatorList.appendChild( new indicatorItem(i) );
        }
        
        this.indicator.appendChild( this.indicatorList  );
        this.view.appendChild(this.indicator);
        
        //center indicator
        this.indicatorList.style.width = this.indicatorList.offsetWidth + 'px';
        this.indicatorList.style.display = 'block';
    };

    SlideShow.prototype.events = function(){
        var self = this;
        //Events
        var touchStartX = 0;
        var touchStartY = 0;
        var lastTouchX = 0;
        var lastTouchX = 0;
        var lastTouchTime = 0;
        
        /*
        
        var output = document.createElement('div');
        output.style.border = '1px solid red';
        output.style.color = "#fff";
        output.style.position = 'absolute';
        output.style.height = '40px';
        output.style.top = '0px';
        output.style.left = '0px'
        output.style.zIndex = 100;
        this.view.appendChild(output);
        */
        
        //touch start
        this.view.addEventListener('touchstart',function(e){
            //  e.preventDefault();
            //output.innerHTML = 'touchstart'
            touchStartX = lastTouchX = e.touches[0].pageX;
            touchStartY = lastTouchY = e.touches[0].pageY;
            lastTouchTime = e.timeStamp;
        },false);
        
        //touch move
        this.view.addEventListener('touchmove',function(e){
            // e.preventDefault();
            
            var deltaX;
            var deltaY;
            var touch = e.touches[0];
            lastTouchX = touch.pageX;
            lastTouchY = touch.pageY;
            
            if(self.isAndroid){
                deltaX = touch.pageX - touchStartX;
                deltaY = touch.pageY - touchStartY;
                var timeDelta = e.timeStamp - lastTouchTime;

                //output.innerHTML = 'touchmove '+deltaX;
                //console.log( deltaX, deltaY, timeDelta );
                if(  Math.abs(deltaY) > Math.abs(deltaX) // Y movement was greater than X movement
                    || Math.abs(deltaX) < 5 )//not enough movement) {  // Took too long, is probably not a swipe
                {
                    return; 
                }
                //console.log("Checking for swipe: success!");
                if( deltaX < 0 ){
                     self.next();
                }else {
                    self.prev();
                }
            }else{
                
                //wait for touch end
            }
            
        },false);

        this.view.addEventListener('touchend', function(e){
            //  e.preventDefault();
            if(self.isAndroid) return;
            
            var touch = e.changedTouches[0];

            var deltaX= touch.pageX - touchStartX;
            var deltaY= touch.pageY - touchStartY;
            
            var timeDelta = e.timeStamp - lastTouchTime;
            
            //console.log( deltaX, deltaY, timeDelta );
            if(  Math.abs(deltaY) > Math.abs(deltaX) // Y movement was greater than X movement
                || Math.abs(deltaX) <  MIN_DELTA_FOR_SWIPE // Not enough movement
                || timeDelta > MAX_TIME_FOR_SWIPE) {  // Took too long, is probably not a swipe
                return; 
            }
            //console.log("Checking for swipe: success!");
            if( deltaX < 0 ) self.next();
            else self.prev();
        });

        this.nextBtn.addEventListener( this.clickEvent, function(e){
            e.preventDefault();
            e.stopPropagation();
            self.playing = false;
            if(self.transitioning === false) self.next();
        }, false);
        this.prevBtn.addEventListener( this.clickEvent, function(e){
            e.preventDefault();
            e.stopPropagation();
            self.playing = false;
            if(self.transitioning === false) self.prev();
        }, false);
        
        //on window resize
        if(window.addEventListener)
        window.addEventListener('resize',function(){
            self.windowResize();
        }, false);
    };
    
    SlideShow.prototype.startLoop = function(){
        var self = this;
        
        function loop(){
            if(self.playing){
                self.next();
                setTimeout(loop, self.delay );
            }
        }
        setTimeout(loop, this.delay );
        
    };
    SlideShow.prototype.setDimensions = function(){
        var newHeight = 0;
        
        this.view.style.height = this.slides[0].offsetHeight + 'px';    
        /*
        //fork for resizeToImage
        if(this.isFullScreen){
            for(var i=0;i<this.slides.length;++i){
                var img = this.slides[i].getElementsByTagName('img')[0];
                var canvas = this.slides[i].getElementsByTagName('canvas')[0];
                
                var originalWidth = img.getAttribute('width');
                var newWidth = this.view.offsetWidth;
                var originalHeight = img.getAttribute('height');
            
                newHeight = this.getRatio( originalWidth, originalHeight, newWidth );
                img.style.height = newHeight + 'px';
                if(canvas) canvas.style.height = newHeight + 'px';
            }
            this.view.style.height = newHeight + 'px';
            
        }else{
            //set as height of li
            this.view.style.height = this.slides[0].offsetHeight + 'px'; //get the offsetHeight
            
            //reset slide width
            this.slideWidth = this.slides[0].offsetWidth;
            
            //update so offset will += width
            this.update();
        }*/
    };
    SlideShow.prototype.windowResize = function(){
        this.viewWidth = this.view.offsetWidth;
        this.viewHeight = this.view.offsetHeight;

        //adjust height
        this.setDimensions();
    };
    SlideShow.prototype.next = function(){
        if(this.active_index < this.slides.length-1){
            this.active_index++;
        }else{
            this.active_index = 0;
        }
        this.update('next');
        
    };
    SlideShow.prototype.prev = function(){
        if(this.active_index > 0){
            this.active_index--;
        }else{
            this.active_index = this.slides.length-1;
        }
        this.update('prev');
    };
    SlideShow.prototype.gotoSlide = function(num){
        this.active_index = num-1;
        this.update();
    };
    SlideShow.prototype.update = function( dir ){
        /*full screen fork*/
        if(this.isFullScreen){
            this.animateSlides(dir);
        }else{
            this.animateList(dir);
        }
        //update indicator
        this.updateIndicator();
        
        if(this.updateAnimations) this.updateAnimations();
    };
    SlideShow.prototype.updateIndicator = function(){
        var lis = this.indicatorList.getElementsByTagName('li');
        for(var i=0;i<lis.length;i++){
            if(i ===  this.active_index){
                lis[i].classList.add('active');
            }else{
                lis[i].classList.remove('active');
            }
        }
    };
    SlideShow.prototype.animateSlides = function( dir ){
        var self = this;
        for(var i=0;i<this.slides.length;i++){
            
            if(i === this.active_index ){
                
                //set prev slide
                if(this.active_index-1 >= 0){
                    this.previousSlide = this.slides[this.active_index-1];
                }else{
                    //on first slide
                    this.previousSlide = this.slides[this.slides.length-1];
                    //move previous slide stage left
                    this.previousSlide.style.zIndex = 0;
                    this.previousSlide.style.left  =  -this.viewWidth+'px';
                }
                //set current
                this.currentSlide = this.slides[i];
                
                //set next slide
                if(this.active_index+1 <= this.slides.length-1){
                    this.nextSlide = this.slides[this.active_index+1];
                }else{
                    //on last slide
                    this.nextSlide = this.slides[0];
                    //move next slide stage right
                    this.nextSlide.style.zIndex = 0;
                    this.nextSlide.style.left  =  this.viewWidth +'px';
                }
                this.transitioning = true; //prevents user from going through slides too fast
                
                
                this.currentSlide.style.zIndex = 2;
                this.currentSlide.style.left = 0;

                
                //end transition
                var transitionEnd = this.whichTransitionEvent();
                if(transitionEnd){
                    this.currentSlide.addEventListener(transitionEnd, function( e ) {
                        self.transitioning = false;
                        //console.log('transitionEnd')
                    }, false );
                }else{
                    self.transitioning = false;
                }
                
                
            }else if(i < this.active_index ){
                //slide is less than active, move stage left
                this.slides[i].style.zIndex = 0;
                this.slides[i].style.left = -this.viewWidth+'px';
            }else{
                //slide is greater than active, move stage right
                if(this.slides[i] !== this.previousSlide){
                
                    this.slides[i].style.zIndex = 0;
                    this.slides[i].style.left = this.viewWidth+'px';
                }
            }
        }
        
    };


    SlideShow.prototype.animateList = function( dir ){
        var self = this;
        
        //calculate slides showing
        var slidesShowing = Math.round(this.viewWidth / this.slideWidth);
        
        
        //bounds
        if( this.active_index === 0 ){
            //hide prev
            this.prevBtn.style.display = 'none';
        }
        else if( this.active_index === this.slides.length - slidesShowing ){
            //hide next
            this.nextBtn.style.display = 'none';
        }else {
            this.prevBtn.style.display = 'block';
            this.nextBtn.style.display = 'block';
        }
        
        //animate
        for( var i = 0; i<this.slides.length; i++) {
            var offset = (i - this.active_index) * this.slideWidth;
            this.slides[i].style.left = offset + 'px';
        }
    };



    /**
     * helper functions or slideShow utils
     */
    SlideShow.prototype.getRatio = function(d1,d2,valueOf1){
        d1 = d1 * 0.1;
        d2 = d2 * 0.1;
        //return valueOf2
        return Math.round( (d2*valueOf1) / d1 );
    };


    /**
     *@see http://stackoverflow.com/questions/5023514/how-do-i-normalize-css3-transition-functions-across-browsers
     */
    SlideShow.prototype.whichTransitionEvent = function(){
        var t;
        var el = document.createElement('fakeelement');
        var transitions = {
            'transition':'transitionend',
            'OTransition':'oTransitionEnd',
            'MozTransition':'transitionend',
            'WebkitTransition':'webkitTransitionEnd'
        }
        for(t in transitions){
            if( el.style[t] !== undefined ){
                return transitions[t];
            }
        }
    }

    return SlideShow;
});