# JS slide

javascript 공부를 목적으로 제작한 슬라이드입니다.

<br>

## 0. 준비하기

### 디렉토리

```bash
dist
 ├─css
 │  └─jsSlide.min.css
 ├─images
 │  ├─btn_prev.png
 │  ├─btn_next.png
 │  ├─btn_pause.png
 │  └─btn_play.png
 ├─js
 │  └─jsSlide.min.js
 └─index.html
```

<br>

### HTML 구조
```html
<!-- 슬라이드 컨테이너 -->
<div class="slide-cont">
  <!-- 슬라이드 -->
  <div class="slide-wrap">
    <ul class="slide">
      <!-- 슬라이드 아이템 -->
      <li></li>
    </ul>
  </div>

  <!-- 이전, 다음 버튼 -->
  <button class="btn-prev" type="button"><span class="screen-out">이전 슬라이드</span></button>
  <button class="btn-next" type="button"><span class="screen-out">다음 슬라이드</span></button>

  <!-- 인디케이터 -->
  <ul class="indicator"></ul>

  <!-- 자동 재생 토글 버튼 -->
  <button class="btn-timer" type="button" aria-pressed="true" aria-label="자동 재생 일시 정지"></button>
</div>
```

<br>

### CSS 추가
jsSlide.min.css 외에 사용자 정의 스타일을 추가합니다.
```css
.slide-cont .slide-wrap {width: 100%; height: 675px;}
```

<br>

## 1. 슬라이드 생성하기
```html
<script>
  const initSlide = new Slide();
</script>
```

<br>

## 2. 슬라이드 설정 바꾸기

슬라이드 선택자와 설정을 변경할 수 있습니다.

```html
<script>
  const initSlide = new Slide(el, option);
</script>
```

Parameter | Type | Default | Description
---- | ---- | ---- | ----
el | string  | '.slide-cont' | 슬라이드 컨테이너 선택자
option | object |   | 슬라이드 옵션

<br>

### 옵션

Key | Type | Default | Description
---- | ---- | ---- | ----
type | string | 'carousel' | 전환 효과 : 'carousel' = 캐러셀, 'fade' = 페이드
timer | boolean | false | 슬라이드 자동 재생 활성화
timerSpeed | int | 2000 | 자동 재생 시간
infinite | boolean | false | 무한 반복 활성화
duration | int | 500 | 슬라이드 전환 시간
start | int | 1 | 시작 인덱스
show | int | 1 | 한 번에 표시할 슬라이드 수
between | int | 0 | 슬라이드 간격
