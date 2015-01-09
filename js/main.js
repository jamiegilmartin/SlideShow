'use strict';

define([
    'slideshow'
],function( SlideShow ){
    
    var slideShow_1 = document.getElementById('slideShow_1');

    var ss1 = new SlideShow({
        view : slideShow_1,
        duration : 1,
        looping : true,
        fullscreen :  true
    });

});