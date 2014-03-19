
// *
// Keyboard input routines
// *


// Stops the event from propogating up to the browser so that it won't handle it,
// potentially interfering with the user.
function stop_propagation(event) {
	if(event.stopPropagation) {
		event.stopPropagation();
		event.preventDefault();
	} else {
		event.returnValue = false;
		event.cancelBubble = true;
	}
}


function KeyboardInterface(terminal) {
	//*** Private
	this.terminal = terminal;
	
	this.keydown = keydown;
	this.keypress = keypress;
	
	
	//*** Public
	this.enabled = true;
	
	
	//*** Initialization
	
	// When called by the browser, the event handlers are passed a value of 'this' other 
	// than this class by the browser (ick). Create a closure to get around it.
	var self = this;
	document.onkeydown = function(event) {self.keydown(event)};
	document.onkeypress = function(event) {self.keypress(event)};
}

// Event wrapper functions
function alt(event) {return event.altKey;}
function ctrl(event) {return event.ctrlKey;}
function keycode(event) {return event.keyCode;}

function charcode(event) {
	if(event.charCode) {
		return event.charCode;
	} else {
		return keycode(event);
	}
}


// Percentage of the screen to scroll the terminal by
SCROLL_PERCENTAGE = 2/3;

// keycodes
PAGE_UP = 33;
PAGE_DOWN = 34;
ENTER = 13;
TAB = 9;

CTRL = 17;
ALT = 18;

BACKSPACE = 8;
DELETE = 46;

LEFT = 37;
RIGHT = 39;
UP = 38;
DOWN = 40;


// Handle modifiers/special keys before the browser can interpret them. Pretty much
// only stops firefox from interpreting them... IE is braindead. stop_propagation
// is used to accomplish this in a cross-browser manner, although it doesn't matter
// much in this case, anyway.
function keydown(e) {
	var event = e?e:window.event;
	
	// Don't do anything if we don't have focus
	if(!this.enabled) return;

	if( alt(event) && ctrl(event) && keycode(event) == PAGE_UP ) {

		// Scroll the screen up by the correct amount
		this.terminal.scroll(-Math.round(this.terminal.height * SCROLL_PERCENTAGE));
		
		stop_propagation(event);
	} else if( alt(event) && ctrl(event) && keycode(event) == PAGE_DOWN ) {
	
		// Scroll the screen down by the correct amount
		this.terminal.scroll(Math.round(this.terminal.height * SCROLL_PERCENTAGE));
		
		stop_propagation(event);
	}
	
	if(keycode(event) == ENTER) {
		this.terminal.newline();
		stop_propagation(event);
		
	} else if(keycode(event) == TAB) {
		this.terminal.tab();
		stop_propagation(event);
		
	} else if(keycode(event) == ALT) {
		stop_propagation(event);
		
	} else if(keycode(event) == CTRL) {
		stop_propagation(event);
	
	} else if(keycode(event) == BACKSPACE) {
		this.terminal.backspace();
		
		stop_propagation(event);
		
	} else if(keycode(event) == DELETE) {
		stop_propagation(event);
	}
}// Handle all normal keyboard input
function keypress(e) {
	var event = e?e:window.event;

	// Don't do anything if the mouse isn't over the terminal
	if(!this.enabled) return;

	var ascii = charcode(event);
	var ch = String.fromCharCode(ascii);
	
	// Write out the char to the terminal if it's one of the 95 printable characters
	if(32 <= ascii && ascii <= 126) {
		this.terminal.write_char(ch);
	}

	// Prevent the browser from interpreting the keystrokes and annoying the user
	stop_propagation(event);
}