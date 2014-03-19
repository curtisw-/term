
// *
// Escape code processing routines.
// *


// Return either the given value if it's acceptable or a default value otherwise.
function val(x, def) {
	// Note: if(!x) doesn't produce the correct results
	if(x==""||x==null||x==undefined) {
		return def;
	} else {
		return x;
	}
}


// str should be everything after the escape sequence. Warning: make sure all regexes
// are anchored to the beginning so as not to match other escape sequences. Return
// how many characters to skip from displaying (usually the length of the sequence).
function process_control_sequence(terminal, str) {
	var match;
	
	// ^[ n A  -- move cursor up n rows, or 1 if not specified
	if(match = /^([0-9]*)A/.exec(str)) { 
		terminal.move_cursor(0, -1 * val(match[1], 1));
		return match[0].length;
	}
	
	// ^[ n B  -- move cursor down n rows, or 1 if not specified
	if(match = /^([0-9]*)B/.exec(str)) { 
		terminal.move_cursor(0, 1 * val(match[1], 1));
		return match[0].length;
	}
	
	// ^[ n C  -- move cursor to the right n columns, or 1 if not specified
	if(match = /^([0-9]*)C/.exec(str)) { 
		terminal.move_cursor(1 * val(match[1], 1), 0);
		return match[0].length;
	}
	
	// ^[ n D  -- move cursor to the left n columns, or 1 if not specified
	if(match = /^([0-9]*)D/.exec(str)) { 
		terminal.move_cursor(-1 * val(match[1], 1), 0);
		return match[0].length;
	}
	
	// ^[ n E  -- move cursor down n rows, or 1 if not specified, and sets cursorx = 1
	if(match = /^([0-9]*)E/.exec(str)) { 
		terminal.move_cursor(0, 1 * val(match[1], 1));
		terminal.set_x(1);
		return match[0].length;
	}
	
	// ^[ n F  -- move cursor up n rows, or 1 if not specified, and sets cursorx = 1
	if(match = /^([0-9]*)F/.exec(str)) { 
		terminal.move_cursor(0, -1 * val(match[1], 1));
		terminal.set_x(1);
		return match[0].length;
	}
	
	// ^[ n G  -- move cursor to column n
	if(match = /^([0-9]+)G/.exec(str)) { 
		terminal.set_x(1 * match[1]);
		return match[0].length;
	}
	
	// ^[ n ; m H 
	// ^[ n ; m f
	// -- move cursor to row n column m, 1 is the default for either
	if(match = /^([0-9]*)(;([0-9]*))?[Hf]/.exec(str)) { 
		terminal.set_x(1 * val(match[3], 1));
		terminal.set_y(1 * val(match[1], 1));
		return match[0].length;
	}
	
	// ^[ n J  -- clears part of the screen:
	// 0 - cursor to end of screen [default]
	// 1 - cursor to beginning of screen
	// 2 - entire screen
	if(match = /^([012])?J/.exec(str)) { 
		switch( 1*val(match[1], 0) ) {
			case 0:
				terminal.clear(
					terminal.cursorx, terminal.cursory, 
					terminal.width, terminal.height
				);
				break;
			case 1:
				terminal.clear(
					1, 1, 
					terminal.cursorx, terminal.cursory
				);
				break;
			case 2:
				terminal.clear(
					1, 1, 
					terminal.width, terminal.height
				);
				break;
		}
		return match[0].length;
	}
	
	// ^[ n K  -- clears part of the line:
	// 0 - cursor to end of line [default]
	// 1 - cursor to beginning of line
	// 2 - entire line
	if(match = /^([012])?K/.exec(str)) { 
		switch( 1*val(match[1], 0) ) {
			case 0:
				terminal.clear(
					terminal.cursorx, terminal.cursory, 
					terminal.width, terminal.cursory
				);
				break;
			case 1:
				terminal.clear(
					1, terminal.cursory, 
					terminal.cursorx, terminal.cursory
				);
				break;
			case 2:
				terminal.clear(
					1, terminal.cursory,
					terminal.width, terminal.cursory
				);
				break;
		}
		return match[0].length;
	}
	
	// ^[ n S -- move screen up by n, or 1.
	if(match = /^([0-9]*)S/.exec(str)) {
		var n = 1*val(match[1], 1);
		if(n == 0) return match[0].length;
		
		// Move the screen up by n and delete the excess
		terminal.move_up(n, true);
		
		return match[0].length;
	}
	
	// ^[ n T -- move screen down by n, or 1.
	if(match = /^([0-9]*)T/.exec(str)) {
		var n = 1*val(match[1], 1);
		if(n == 0) return match[0].length;
		
		terminal.move_down(n);
		
		return match[0].length;
	}

	// ^[ n1 ; n2 ; n3 ; ... m -- sets display attributes.
	// Numbers are optional; if none are present, it defaults to 0.
	// If multiple numbers are present, they're applied in sequence.
	if(match = /^([0-9]*)(;[0-9]*)*m/.exec(str)) {
		// codes will always be at least 1 element long
		var codes = [ 1*val(match[1], 0) ];
		if(val(match[2], "").length > 0) {
			var rest = match[2].split(";");
			
			// Convert each element into an integer, or discard it if it's empty
			// and append it to 'codes'.
			for(var i=0; i<rest.length; i++) {
				if(rest[i] != '') {
					codes[codes.length] = 1*rest[i];
				}
			}
		
		}
		for(var i=0; i<codes.length; i++) {
			terminal.set_attribute(codes[i]);
		}

		return match[0].length;
	}
	
	// ^[ s -- saves cursor position
	if(str.charAt(0) == "s") {
		terminal.save_cursor();
		return 1;
	}
	
	// ^[ u -- restores cursor position
	if(str.charAt(0) == "u") {
		terminal.restore_cursor();
		return 1;
	}
	
	// Unsupported or invalid escape sequence, just write out the entire thing
	terminal.write_char("\x1B");
	terminal.write_char("[");

	return 0;
}