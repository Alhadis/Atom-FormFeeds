"use strict";

module.exports = {
	bail: !AtomMocha.isCI,
	slow: 15000,
	snapshotDir: ".atom-mocha",
	require: [
		"chai/register-should",
	],
};
