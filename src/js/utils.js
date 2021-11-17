const getRect = function(el) {
	const rect = el.getBoundingClientRect();
	return rect;
}

/* easing */
const inOutQuad = (n) => {
	n *= 2;
	if (n < 1) return 0.5 * n * n;
	return - 0.5 * (--n * (n - 2) - 1);
};