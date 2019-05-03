"use strict";

const isCI =
	!!(process.env.CI
	|| process.env.CI_NAME
	|| process.env.BUILD_NUMBER
	|| process.env.RUN_ID);

module.exports = {
	bail: !isCI,
	slow: 15000,
	require: [
		"chai/register-should",
		"mocha-when/register",
	],
};
