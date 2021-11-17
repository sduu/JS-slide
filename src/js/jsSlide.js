class JsSlide {
	constructor(el = '.slide-cont', option) {
		this.option = {
			infinite: false,
			duration: 500,
			start: 1,
			...option,
		}

		this.$wrap = document.querySelector(el);
		this.$el = {
			slide: this.$wrap.querySelector('.slide'),
			slideItem: this.$wrap.querySelectorAll('.slide li'),
			btnPrev: this.$wrap.querySelector('.btn-prev'),
			btnNext: this.$wrap.querySelector('.btn-next'),
			indicator: this.$wrap.querySelector('.indicator'),
			indicatorItem: null,
		}

		this.slideNow = 0;
		this.slidePrev = 0;
		this.slideNext = 0;
		this.slideNum = this.$el.slideItem.length;

		this.direction = null;

		this.isAnimating = false;
		this.isBlockPrev = false;
		this.isBlockNext = false;

		/* 초기화 */
		this.setSlide();
		this.bindEvent();
		this.showSlide(this.option.start);
	}

	setSlide() {
		[...this.$el.slideItem].forEach((item, i) => {
			item.setAttribute('data-slide-index', i);

			this.$el.indicator.innerHTML += `<li><button type="button"><span class="screen-out">총 ${this.slideNum}장의 슬라이드 중 ${i + 1}번째 슬라이드</span></button></li>`;
		});

		this.$el.indicatorItem = this.$wrap.querySelectorAll('.indicator li');
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
	}

	showSlide(n) {
		/* 슬라이드가 애니메이션 진행중이면 return */
		if (this.isAnimating) {
			return false;
		}

		/* 무한 루프 슬라이드가 아니면 처음과 끝에서 return */
		if (this.isBlockPrev && this.direction == 'prev' || this.isBlockNext && this.direction == 'next') {
			return false;
		}
		
		this.moveFade(n);
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
		} else if (this.slideNow == this.slideNum) {
			this.$el.btnNext.classList.add('btn-disabled');
			this.isBlockNext = true;
		}
	}
} 