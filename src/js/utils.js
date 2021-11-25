const getRect = function(el) {
	const rect = el.getBoundingClientRect();
	return rect;
}

const getMousePos = function(e) {
	const pos = {};

	if (e && typeof e.target != 'undefined') {
		pos.x = e && e.clientX || (e.touches && e.touches[0].clientX);
		pos.y = e && e.clientY || (e.touches && e.touches[0].clientY);
	}

	return pos;
}

/* easing */
const inOutQuad = (n) => {
	n *= 2;
	if (n < 1) return 0.5 * n * n;
	return - 0.5 * (--n * (n - 2) - 1);
};