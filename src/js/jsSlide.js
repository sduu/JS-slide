class JsSlide {
	constructor(el = '.slide-cont', option) {
		this.option = {
			type: 'carousel',
			infinite: false,
			drag: false,
			reactDrag: false,
			timer: false,
			timerSpeed: 2000,
			duration: 500,
			start: 1,
			show: 1,
			between: 0,
			...option,
		}

		this.$wrap = document.querySelector(el);
		this.$el = {
			slideWrap: this.$wrap.querySelector('.slide-wrap'),
			slide: this.$wrap.querySelector('.slide'),
			slideItem: this.$wrap.querySelectorAll('.slide li'),
			slideItemDub: null,
			btnPrev: this.$wrap.querySelector('.btn-prev'),
			btnNext: this.$wrap.querySelector('.btn-next'),
			indicator: this.$wrap.querySelector('.indicator'),
			indicatorItem: null,
			btnTimer: this.$wrap.querySelector('.btn-timer'),
		}
		this.$etc = {
			before: getFocusable(this.$wrap, 'before') || document.createElement('div'),
			after: getFocusable(this.$wrap, 'after') || document.createElement('div'),
			focusItem: [],
		}

		this.slideNow = 0;
		this.slidePrev = 0;
		this.slideNext = 0;
		this.slideNum = this.$el.slideItem.length;

		this.slideActive = 0;
		this.slideFocus = 0;

		this.rectSlide = {};
		this.itemWidth = 0;

		this.start = {};
		this.move = {};
		this.deltaX = 0;
		this.deltaY = 0;
		this.drag = 0;

		this.timer = null;
		this.timerResize = null;
		this.direction = null;

		this.isAnimating = false;
		this.isBlockPrev = false;
		this.isBlockNext = false;
		this.clicked = false;
		this.isFocusing = false;

		/* 초기화 */
		this.initSlide();
		this.setSlide();
		this.setTimer();
		this.bindEvent();
		this.showSlide(this.option.start);
	}

	initSlide() {
		[...this.$el.slideItem].forEach((item, i) => {
			item.slideIndex = i;

			if (item.querySelector('img')) {
				item.querySelector('img').setAttribute('draggable', false);
			}

			this.$el.indicator.innerHTML += `<li><button type="button"><span class="screen-out">총 ${this.slideNum}장의 슬라이드 중 ${i + 1}번째 슬라이드</span></button></li>`;
		});

		/* 무한 루프 슬라이드면 duplication 생성 */
		if (this.option.infinite && this.option.type == 'carousel') {
			const slideAppend = [...this.$el.slideItem].filter((item, i) => i < this.option.show);
			const slidePrepend = [...this.$el.slideItem].reverse().filter((item, i) => i < this.option.show);

			slideAppend.forEach((item, i) => {
				const duplication = this.$el.slide.appendChild(item.cloneNode(true));
				duplication.slideIndex = i;
			});
			slidePrepend.forEach((item, i) => {
				const duplication = this.$el.slide.insertBefore(item.cloneNode(true), this.$el.slide.firstChild);
				duplication.slideIndex = this.slideNum - (i + 1);
			});
		} else if (!this.option.infinite && this.option.type == 'carousel') {
			/* 무한 루프 슬라이드가 아니면 indicator 개수 조절 */
			[...this.$wrap.querySelectorAll('.indicator li')].forEach((item, i, object) => {
				if (i > this.slideNum - this.option.show) {
					object[i].remove();
				}
			});
		}

		this.$el.indicatorItem = this.$wrap.querySelectorAll('.indicator li');
		this.$el.slideItemDub = this.$wrap.querySelectorAll('.slide li');
	}

	setSlide() {
		this.option.reactDrag = this.option.type == 'fade' ? false : this.option.reactDrag;
		this.option.show = this.option.type == 'fade' ? 1 : this.option.show;

		this.rectSlide = getRect(this.$el.slideWrap);
		this.itemWidth = this.rectSlide.width / this.option.show;

		const diff = (this.$el.slideItemDub.length - this.slideNum) / 2;
		
		[...this.$el.slideItemDub].forEach((item, i) => {
			if (this.option.type == 'carousel') {
				item.style.width = `${this.itemWidth}px`;
				item.style.left = `${((this.itemWidth + this.option.between) * i) - (this.itemWidth + this.option.between) * diff}px`;
			}

			/* 슬라이드 내 포커스 가능한 요소 */
			this.$etc.focusItem[i] = [...item.querySelectorAll('a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])')];
			if (this.$etc.focusItem[i].length <= 0) {
				/* 슬라이드 내 포커스 가능한 요소가 없다면 슬라이드를 포커스 가능한 요소로 변경 */
				this.$etc.focusItem[i] = [item];
				item.setAttribute('tabindex', 0);
			}
		});
	}

	bindEvent() {
		this.$el.btnPrev.addEventListener('click', () => {
			this.direction = 'prev';
			this.showSlide(this.slidePrev);
		});
		this.$el.btnNext.addEventListener('click', () => {
			this.direction = 'next';
			this.showSlide(this.slideNext);
		});
		[...this.$el.indicatorItem].forEach((item, i) => {
			item.addEventListener('click', () => {
				this.direction = null;
				this.showSlide(i + 1);
			});
		});
		this.$el.btnTimer.addEventListener('click', () => {
			this.option.timer = !this.option.timer;
			this.setTimer();
		});
		window.addEventListener('resize', () => this.resize());
		['mousedown', 'touchstart'].forEach((event) => {this.$el.slide.addEventListener(event, (e) => this.mouseDown(e))});
		['mousemove', 'touchmove'].forEach((event) => {document.addEventListener(event, (e) => this.mouseMove(e), {passive: false})});
		['mouseup', 'touchend'].forEach((event) => {document.addEventListener(event, () => this.mouseUp())});

		[...this.$el.slideItemDub, ...this.$el.indicatorItem, this.$el.btnPrev, this.$el.btnNext, this.$el.btnTimer, this.$etc.after, this.$etc.before].forEach((item) => {
			item.addEventListener('keydown', (e) => {this.keyDown(e)});
		});
	}

	showSlide(n) {
		/* 슬라이드가 애니메이션 진행중이면 return */
		if (this.isAnimating) {
			return false;
		}

		/* 무한 루프 슬라이드가 아니면 끝에서 자동 재생 정지 */
		if (this.isBlockNext) {
			this.option.timer = false;
			this.setTimer();
		}

		/* 무한 루프 슬라이드가 아니면 처음과 끝에서 return */
		if (this.isBlockPrev && this.direction == 'prev' || this.isBlockNext && this.direction == 'next') {
			n = this.slideNow;
		}

		/* 자동재생 */
		this.stopTimer();
		if (this.option.timer) {
			this.playTimer();
		}

		/* 슬라이드 전환 타입  */
		if (this.option.type == 'carousel') {
			this.slideActive = this.option.infinite ? (n - 1) + this.option.show : (n - 1);
			this.moveCarousel(n);
		} else if (this.option.type == 'fade') {
			this.slideActive = (n - 1);
			this.moveFade(n);
		}

		this.setIndex(n);
		this.setIndicator();
		this.setAccessibility();

		/* 무한 루프 슬라이드면 return */
		if (this.option.infinite) {
			return false;
		}
		this.setSlideBlock();
	}

	moveFade(n) {
		[...this.$el.slideItem].forEach((item) => {
			item.style.opacity = 0;
		});

		const exIndex = this.slideNow;
		let start = null;
		let frame = null;

		const step = (timestamp) => {
			if (!start) {
				start = timestamp;
				this.animationStart();
			}

			const runtime = timestamp - start;
			const progress = runtime / this.option.duration;
			const easing = inOutQuad(Math.min(progress, 1));

			this.$el.slideItem[exIndex - 1].style.opacity = 1 - easing;
			this.$el.slideItem[n - 1].style.opacity = easing;

			if (runtime < this.option.duration) {
				frame = window.requestAnimationFrame(step);
			} else {
				this.animationEnd();
			}
		};

		frame = window.requestAnimationFrame(step);

		/* 슬라이드가 처음 로드되었거나 슬라이드 인덱스가 변화 없을 시 애니메이션 없음 */
		if (this.slideNow === 0 || n == this.slideNow) {
			this.$el.slideItem[n - 1].style.opacity = 1;
			cancelAnimationFrame(frame);
		}
	}

	moveCarousel(n) {
		const exIndex = this.slideNow;
		const drag = this.drag;
		let diff = exIndex - n;
		let start = null;
		let frame = null;

		if (this.option.infinite && exIndex == this.slideNum && this.direction == 'next') {
			diff = -1;
			this.slideActive += this.slideNum;
		} else if (this.option.infinite && exIndex == 1 && this.direction == 'prev') {
			diff = 1;
			this.slideActive -= this.slideNum;
		}

		const step = (timestamp) => {
			if (!start) {
				start = timestamp;
				this.animationStart();
			}

			const runtime = timestamp - start;
			const progress = runtime / this.option.duration;
			const easing = inOutQuad(Math.min(progress, 1));

			this.$el.slide.style.transform = `translate3d(${-(this.itemWidth + this.option.between) * (exIndex - 1) + drag + (diff * (this.itemWidth + this.option.between) * easing) - (drag * easing)}px, 0, 0)`;

			if (runtime < this.option.duration) {
				frame = window.requestAnimationFrame(step);
			} else {
				this.animationEnd();
			}
		};

		frame = window.requestAnimationFrame(step);

		/* 슬라이드가 처음 로드되었을때 애니메이션 없음 */
		if (this.slideNow === 0) {
			this.$el.slide.style.transform = `translate3d(${-(n - 1) * this.itemWidth}px, 0, 0)`;
			cancelAnimationFrame(frame);
		}
	}

	animationStart() {
		this.isAnimating = true;
	}

	animationEnd() {
		this.isAnimating = false;

		/* 슬라이드 내 포커싱 중이 아니면 return */
		if (!this.isFocusing) {
			return false;
		}

		this.option.timer = false;
		this.setTimer();

		triggerFocus(this.$etc.focusItem[this.slideActive][0]);
	}

	setIndex(n) {
		this.slideNow = n;
		this.slidePrev = n - 1 < 1 ? this.slideNum : n - 1;
		this.slideNext = n + 1 > this.slideNum ? 1 : n + 1;
	}

	setIndicator() {
		[...this.$el.indicatorItem].forEach((item, i) => {
			if (i === this.slideNow - 1) {
				item.classList.add('active');
				item.setAttribute('aria-current', true);
			} else {
				item.classList.remove('active');
				item.setAttribute('aria-current', false);
			}
		});
	}

	setSlideBlock() {
		this.$el.btnPrev.classList.remove('btn-disabled');
		this.$el.btnNext.classList.remove('btn-disabled');
		this.isBlockPrev = this.isBlockNext = false;

		if (this.slideNow == 1) {
			this.$el.btnPrev.classList.add('btn-disabled');
			this.isBlockPrev = true;
		}

		if (this.slideNow > this.slideNum - this.option.show) {
			this.$el.btnNext.classList.add('btn-disabled');
			this.isBlockNext = true;
		}
	}

	setTimer() {
		if (this.option.timer) {
			this.playTimer();
			this.$el.btnTimer.classList.add('active');
			this.$el.btnTimer.setAttribute('aria-pressed', false);
		} else {
			this.stopTimer();
			this.$el.btnTimer.classList.remove('active');
			this.$el.btnTimer.setAttribute('aria-pressed', true);
		}
	}

	playTimer() {
		this.direction = 'next';
		this.timer = setTimeout(() => {this.showSlide(this.slideNext)}, this.option.timerSpeed);
	}

	stopTimer() {
		clearTimeout(this.timer);
	}

	setAccessibility() {
		[...this.$el.slideItemDub].forEach((item, i) => {
			if (i >= this.slideActive && i < this.slideActive + this.option.show) {
				item.setAttribute('aria-hidden', false);
			} else {
				item.setAttribute('aria-hidden', true);
			}
		});
	}

	resize() {
		clearTimeout(this.timerResize);
		this.timerResize = setTimeout(() => {
			this.direction = null;
			this.setSlide();
			this.showSlide(this.slideNow);
		}, 66);
	}

	mouseDown(e) {
		/* 스와이프가 비활성화 되어있거나 슬라이드가 애니메이션 진행중이면 return */
		if (!this.option.drag || this.isAnimating) {
			return false;
		}

		this.direction = null;
		this.start = getMousePos(e);
		this.clicked = true;
	}

	mouseMove(e) {
		/* 슬라이드를 클릭하지 않았으면 return */
		if (!this.clicked) {
			return false;
		}

		this.move = getMousePos(e);
		this.deltaY = this.move.y - this.start.y;

		/* 커서가 슬라이드 범위를 벗어나면 리셋 */
		if (this.move.x < this.rectSlide.x || this.move.x > this.rectSlide.width + this.rectSlide.x) {
			this.deltaX = 0;
			return false;
		} else {
			this.deltaX = this.move.x - this.start.x;
		}

		/* 세로 스와이프 시 return */
		if (Math.abs(this.deltaX) > 5 && Math.abs(this.deltaY) < 5) {
			e.preventDefault();
		} else if (Math.abs(this.deltaX) < 5 && Math.abs(this.deltaY) > 5) {
			this.deltaX = 0;
			return false;
		}

		/* reactDrag 옵션이 비활성화 되어있으면 return */
		if (!this.option.reactDrag) {
			return false;
		}

		this.drag = this.deltaX;

		/* 무한 루프 슬라이드가 아니면 가장자리에서 저항 추가 */
		if ((this.isBlockPrev && this.deltaX > 0) || (this.isBlockNext && this.deltaX < 0)) {
			this.deltaX = this.drag = this.deltaX / 5;
		}

		this.$el.slide.style.transform = `translate3d(${-(this.itemWidth + this.option.between) * (this.slideNow - 1) + this.drag}px, 0, 0)`;
	}

	mouseUp() {
		/* 슬라이드를 클릭하지 않았으면 return */
		if (!this.clicked) {
			return false;
		}

		if (this.deltaX <= 30 && this.deltaX >= -30) {
			this.showSlide(this.slideNow);
		} else if (this.deltaX < 30) {
			this.direction = 'next';
			this.showSlide(this.slideNext);
		} else if (this.deltaX > 30) {
			this.direction = 'prev';
			this.showSlide(this.slidePrev);
		}

		this.deltaX = this.drag = 0;
		this.clicked = false;
		
		['mousemove', 'touchmove'].forEach((event) => {document.removeEventListener(event, this.mouseMove)});
		['mouseup', 'touchend'].forEach((event) => {document.removeEventListener(event, this.mouseUp)});
	}

	keyDown(e) {
		/* 키보드 접근 시 timer 멈춤 */
		this.option.timer = false;
		this.setTimer();

		[...this.$etc.focusItem].forEach((item, i, a) => {
			if (item.includes(e.target)) {
				this.slideFocus = a.indexOf(item);
			}
		});

		if (e.key == 'Tab' && !e.shiftKey) {
			/* 탭키 이벤트 */
			this.eventKeyTab(e);
		} else if (e.key == 'Tab' && e.shiftKey) {
			/* 백탭 이벤트 */
			this.eventKeyBackTab(e);
		} else if (e.keyCode === 37) {
			/* 왼쪽 방향키 */
			this.direction == 'prev';
			this.showSlide(this.slidePrev);
		} else if (e.keyCode === 39) {
			/* 오른쪽 방향키 */
			this.direction == 'next';
			this.showSlide(this.slideNext);
		}
	}

	eventKeyTab(e) {
		this.isFocusing = true;
		switch (e.target) {
			case this.$etc.before:
				e.preventDefault();
				triggerFocus(this.isBlockPrev ? this.$etc.focusItem[this.slideActive][0] : this.$el.btnPrev);
				break;

			case this.$el.btnPrev:
				e.preventDefault();
				triggerFocus(this.$etc.focusItem[this.slideActive][0]);
				break;

			case this.$etc.focusItem[this.slideActive][this.$etc.focusItem[this.slideActive].length - 1]:
				e.preventDefault();
				triggerFocus(this.isBlockNext ? this.$el.indicatorItem[0].firstChild : this.$el.btnNext);
				break;

			case this.$el.btnTimer:
				this.isFocusing = false;
				break;
		}
	}

	eventKeyBackTab(e) {
		this.isFocusing = true;
		switch (e.target) {
			case this.$etc.after:
				this.isFocusing = false;
				break;

			case this.$el.btnNext:
				e.preventDefault();
				triggerFocus(this.$etc.focusItem[this.slideActive][this.$etc.focusItem[this.slideActive].length - 1]);
				break;

			case this.$el.btnPrev:
				e.preventDefault();
				this.isFocusing = false;
				triggerFocus(this.$etc.before);
				break;

			case this.$etc.focusItem[this.slideActive][0]:
				e.preventDefault();
				triggerFocus(this.isBlockPrev ? this.$etc.before : this.$el.btnPrev);
				break;

			case this.$etc.focusItem[0][0]:
				e.preventDefault();
				triggerFocus(this.isBlockPrev ? this.$etc.before : this.$el.btnPrev);
				break;

			case this.$el.indicatorItem[0].firstChild:
				e.preventDefault();
				triggerFocus(this.isBlockNext ? this.$etc.focusItem[this.slideActive][this.$etc.focusItem[this.slideActive].length - 1] : this.$el.btnNext);
				break;
		}
	}
} 