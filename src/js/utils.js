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

const getFocusable = (el, axis) => {
	let target = el;
	let focusable;
	let idx = 0;

	do {
		if (target == document.body) {
			break;
		}
		focusable = [...target.parentNode.querySelectorAll('a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])')].filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
		if (axis === 'after') {
			focusable.reverse();
		}
		idx = focusable.findIndex((item) => (el.contains(item)));
		target = target.parentNode;
	} while (idx === 0);

	return focusable.slice(0, idx)[idx - 1];
}

const triggerFocus = (el) => {
	const eventType = "onfocusin" in el ? "focusin" : "focus";
	const bubbles = "onfocusin" in el;
	let event;

	if ("createEvent" in document) {
		event = document.createEvent("Event");
		event.initEvent(eventType, bubbles, true);
	}
	else if ("Event" in window) {
		event = new Event(eventType, {bubbles: bubbles, cancelable: true});
	}

	el.focus();
	el.dispatchEvent(event);
}

/* easing */
const inOutQuad = (n) => {
	n *= 2;
	if (n < 1) return 0.5 * n * n;
	return - 0.5 * (--n * (n - 2) - 1);
};