"use strict";

module.exports = {
	bail: !AtomMocha.isCI,
	slow: 15000,
	require: [
		"chai/register-should",
	],
};
