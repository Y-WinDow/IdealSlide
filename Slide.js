var events = require('../modules/events');
var effects = require('../slide_effects');

function Slide(options){
	this.init(options);
	this.auto && this.waitForNext();
}
Slide.prototype = $.extend(events(), {
	init:function (options){
		this.initElements(options);
		this.bindEvents();
	},
	initElements: function (options){
		this.$container = $(options.container);
		this.$eles = $(options.eles);
		this.$navItems = $(options.nav);
		this.$prevBtn = $(options.prevBtn);
		this.$nextBtn = $(options.nextBtn);
		
		this.index = options.index || 0;
		this.length = this.$eles.length;
		this.navEvent = options.navEvent || 'click';
		this.activeNavCls = options.activeNavCls || '';
		this.auto = ('auto' in options ? options.auto : 5000);

		this.animator = new Animator({
			effect: options.effect || 'blank',
			duration: options.duration,
			core: this
		});
		this.userAction = false; // 特殊变量 userAction用于标记因用户操作发生的切换 为false则是auto切换
		this.options = options;
	},
	bindEvents: function (){
		var self = this;
		this.animator.on('animationEnd', function (){
			self.auto && self.waitForNext();
			self.userAction = false;
			self.emit('animationEnd');
		});
		this.on('toIndex', function (index){
			self.animator.animate(index);
			self.index = index;
			this.$navItems && this.$navItems.removeClass(self.activeNavCls).eq(self.index).addClass(self.activeNavCls);
		});

		this.$navItems.length && this.$navItems.on(this.navEvent, function (){
			self.userAction = true;
			self.toIndex(self.$navItems.index(this));
		});
		this.$prevBtn.on('click', function (){
			self.toPrev();
		});
		this.$nextBtn.on('click', function (){
			self.toNext();
		});
	},
	toPrev: function (){
		this.toIndex(this.index - 1);
		this.emit('toPrev');
	},
	toNext: function (){
		this.toIndex(this.index + 1);
		this.emit('toNext');
	},
	toIndex: function (index){
		if(this.isAnimating){
			return;
		}
		index = (index + this.length) % this.length;
		if(index === this.index){
			return;
		}
		this.emit('toIndex', index);
	},
	waitForNext: function (){
		var self = this;
		this.pause();
		this.autoTimer = setTimeout(function (){
			self.toNext();
		}, this.auto);
	},
	pause: function (){
		if(this.autoTimer){
			clearTimeout(this.autoTimer);
			this.autoTimer = null;
		}
	}
});

function Animator(options){
	this.init(options);
}
Animator.prototype = $.extend(events(), {
	init: function (options){
		this.core = options.core;
		this.effect = options.effect || 'blank';
		this.duration = options.duration || 500;

		this.effectFn = effects[this.effect];
		this.effectFn.init && this.effectFn.init.call(this);
	},
	animate: function (index){
		if(!this.effectFn){
			return;
		}
		this.core.isAnimating = true;
		this.effectFn.play.call(this, index);
	},
	end: function (){
		this.core.isAnimating = false;
		this.emit('animationEnd');
	}
});

$.fn.slidesjs = function (options){
	var slide = this.data('slide');
	if(slide && (slide instanceof Slide)){
		return slide;
	}
	this.data('slide', new Slide($.extend({
		container: this.get(0),
		eles: this.children()
	}, options || {})));

	return this;
};

module.exports = Slide;