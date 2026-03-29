/**
 * Features in this list are intentionally excluded from automatic detection.
 * They either require HTML or CSS analysis, are overly broad umbrella features, or would give a false sense of completeness from JS-only scanning.
 */
export const MANUAL_FEATURE_NAMES = new Set([
	'Element.prototype.inert',
	'Element.prototype.placeholder',
	'HTMLElement.prototype.inert',
	'HTMLPictureElement',
	'HTMLTemplateElement',
	'Intl.DateTimeFormat.~timeZone.all',
	'Intl.DateTimeFormat.~timeZone.golden',
	'smoothscroll',
	'UserTiming',
	'WebAnimations'
]);
