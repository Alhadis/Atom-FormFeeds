"use strict";

const {CompositeDisposable} = require("atom");

let disposables = null;

module.exports = {
	
	// Initialise the package and register event handlers
	activate(state = {}){
		if(null !== disposables)
			disposables.dispose();
			
		// Update CSS classes on <body> when these settings change
		disposables = new CompositeDisposable();
		disposables.add(atom.config.observe("form-feeds.placeholderStyle", type => {
			const classes = document.body.classList;
			classes.toggle("ff-style-border", "border" === type);
			classes.toggle("ff-style-caret",  "caret"  === type);
			classes.toggle("ff-style-none",   "none"   === type);
		}));
	},
	
	// Free-up memoery when deactivating package
	deactivate(){
		if(null !== disposables){
			disposables.dispose();
			disposables = null;
		}
	},
};
