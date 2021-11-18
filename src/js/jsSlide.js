class JsSlide {
	constructor(el = '.slide-cont', option) {
		this.option = {
			type: 'carousel',
			infinite: false,
			timer: false,
			timerSpeed: 2000,
			duration: 500,
			start: 1,
			show: 1,
			...option,
		}

		this.$wrap = document.querySelector(el);
		this.$el = {
			slide: this.$wrap.querySelector('.slide'),
			slideItem: this.$wrap.querySelectorAll('.slide li'),
			slideItemDub: null,
			btnPrev: this.$wrap.querySelector('.btn-prev'),
			btnNext: this.$wrap.querySelector('.btn-next'),
			indicator: this.$wrap.querySelector('.indicator'),
			indicatorItem: null,
			btnTimer: this.$wrap.querySelector('.btn-timer'),
		}

		this.slideNow = 0;
		this.slidePrev = 0;
		this.slideNext = 0;
		this.slideNum = this.$el.slideItem.length;

		this.rectSlide = {};
		this.itemWidth = 0;

		this.timer = null;
		this.direction = null;

		this.isAnimating = false;
		this.isBlockPrev = false;
		this.isBlockNext = false;

		/* 초기화 */
		this.setSlide();
		this.setTimer();
		this.bindEvent();
		this.showSlide(this.option.start);
	}

	setSlide() {
		this.option.show = this.option.type == 'fade' ? 1 : this.option.show;
		console.log(this.option.show);
		this.rectSlide = getRect(this.$el.slide);
		this.itemWidth = this.rectSlide.width / this.option.show;

		[...this.$el.slideItem].forEach((item, i) => {
			item.setAttribute('data-slide-index', i);

			this.$el.indicator.innerHTML += `<li><button type="button"><span class="screen-out">총 ${this.slideNum}장의 슬라이드 중 ${i + 1}번째 슬라이드</span></button></li>`;

			if (this.option.type == 'carousel') {
				item.style.width = `${this.itemWidth}px`;
				item.style.left = `${this.itemWidth * i}px`;
			}
		});

		/* 무한 루프 슬라이드면 duplication 생성 */
		if (this.option.infinite && this.option.type == 'carousel') {
			const slideAppend = [...this.$el.slideItem].filter((item, i) => i < this.option.show);
			const slidePrepend = [...this.$el.slideItem].reverse().filter((item, i) => i < this.option.show);

			slideAppend.forEach((item, i) => {
				const duplication = this.$el.slide.appendChild(item.cloneNode(true));
				duplication.style.left = `${this.itemWidth * this.slideNum + this.itemWidth * i}px`;
			});
			slidePrepend.forEach((item, i) => {
				const duplication = this.$el.slide.insertBefore(item.cloneNode(true), this.$el.slide.firstChild);
				duplication.style.left = `${-this.itemWidth * (i + 1)}px`;
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
			return false;
		}

		/* 자동재생 */
		this.stopTimer();
		if (this.option.timer) {
			this.playTimer();
		}
		
		/* 슬라이드 전환 타입  */
		if (this.option.type == 'carousel') {
			this.moveCarousel(n);
		} else if (this.option.type == 'fade') {
			this.moveFade(n);
		}

		this.setIndex(n);
		this.setIndicator();

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

		/* 슬라이드가 처음 로드되었을때 애니메이션 없음 */
		if (this.slideNow === 0) {
			this.$el.slideItem[n - 1].style.opacity = 1;
			cancelAnimationFrame(frame);
		}
	}

	moveCarousel(n) {
		const exIndex = this.slideNow;
		let diff = exIndex - n;
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

			if (this.option.infinite && exIndex == this.slideNum && this.direction == 'next') {
				diff = -1;
			} else if (this.option.infinite && exIndex == 1 && this.direction == 'prev') {
				diff = 1;
			}

			this.$el.slide.style.transform = `translate3d(${-this.itemWidth * (exIndex - 1) + (diff * this.itemWidth * easing)}px, 0, 0)`;

			if (runtime < this.option.duration) {
				frame = window.requestAnimationFrame(step);
			} else {
				this.animationEnd();
			}
		};

		frame = window.requestAnimationFrame(step);

		/* 슬라이드가 처음 로드되었을때 애니메이션 없음 */
		if (this.slideNow === 0) {
			this.$el.slide.style.transform = `translate3d(${-(n - 1) * this.rectSlide.width}px, 0, 0)`;
			cancelAnimationFrame(frame);
		}
	}

	animationStart() {
		this.isAnimating = true;
	}

	animationEnd() {
		this.isAnimating = false;
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
			} else {
				item.classList.remove('active');
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
} 