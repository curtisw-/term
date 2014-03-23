// Provides low-level terminal routines. See the independent 'print' routine for 
// control sequence processing and other higher level activities.
function Terminal(
	container, 
	width, 
	height, 
	default_background, 
	default_foreground,
	line_height
) {
	
	//**** Private
	
	this.container = container;
	
	this.line_height = line_height;
	this.num_excess_lines = 0; // Number of lines that aren't visible
	
	this.default_background = default_background;
	this.default_foreground = default_foreground;

	this.chars = [];
	this.breaks = [];
	
	// These start at one to be compatible with vt100 escape codes
	this.cursorx = 1; 
	this.cursory = 1;
	
	// For save_cursor and restore_cursor
	this.savedx = undefined;
	this.savedy = undefined;
	
	this.get = get;
	this.getxy = getxy;
	
	this.set_char = set_char;
	this.set_char_xy = set_char_xy;
	
	this.get_char = get_char;
	this.get_char_xy = get_char_xy;

	this.clear_char = clear_char;
	this.clear_attributes = clear_attributes;
	
	this.set_attribute = set_attribute;
	this.apply_attributes = apply_attributes;
	this.apply_attributes_xy = apply_attributes_xy;
	
	this.initialize_row = initialize_row;
	
	this.delete_row_tags = delete_row_tags;
	
	
	//**** Public
	this.width = width;  // Read-only   
	this.height = height;  // Read-only
	
	this.tab_size = 4;
	
	this.move_cursor = move_cursor;
	this.save_cursor = save_cursor;
	this.restore_cursor = restore_cursor;
	
	this.set_x = set_x;
	this.set_y = set_y;
	
	this.clear = clear;
	
	this.write_char = write_char;
	
	this.newline = newline;
	this.tab = tab;
	this.backspace = backspace;
	
	// Move the terminal node within a containing node that clips off the excess
	this.move_up = move_up;
	this.move_down = move_down;
	
	this.scroll = scroll;
	
	// Scrolls the terminal all the way down
	this.reset_scroll_pos = reset_scroll_pos;
	
	
	//**** Initialization
	for(var i=height-1; i>=0; i--) {
		this.initialize_row(i, this.container.firstChild);
	}

	this.clear_attributes();
}


function initialize_row(row_num, insert_before) {
	var insert_before_node = insert_before;
	
	// Store br node for later access
	var br = document.createElement("br");
	this.breaks[row_num] = br;
	this.container.insertBefore(br, insert_before_node);
	insert_before_node = br;
	
	this.chars[row_num] = [];
	
	for(var x=this.width-1; x>=0; x--) {
		ch = document.createElement("span");
		
		ch.innerHTML = "&nbsp;";
		ch.style.background = get_background(this.default_background);
		ch.style.color = get_foreground(this.default_foreground, false);
		
		this.container.insertBefore(ch, insert_before_node);
		insert_before_node = ch;
		this.chars[row_num][x] = ch;
	}
	return insert_before_node; // Return the last node inserted
}


// Delete each character that's in the row from the containing element and remove the br.
// 'row' needs to be a valid row index.
function delete_row_tags(row) {
	// Iterate through each character in the row and delete it
	for(var ch=0; ch<this.width; ch++) {
		this.container.removeChild(this.chars[row][ch]);
		this.chars[row][ch] = undefined;
	}
	
	// Delete the corresponding br tag
	this.container.removeChild(this.breaks[row]);
	this.breaks[row] = undefined;
}


// Move the rows in the terminal up the given amount. If del is true, the inaccessible
// row tags are deleted. Otherwise, they're left alone. The latter behavior provides a means
// for a 'history' which the user could scroll up through. Blank rows are added to the bottom
// as required. 'amount' should be positive.
function move_up(amount, del) {
	// Check preconditions
	if(amount <= 0) return;
	
	// If we should delete the inaccessible rows, do it now
	if(del) {
		for(var row=0; row<amount; row++) {
			this.delete_row_tags(row);
		}
	}
	// Cycle through the rows and move them up the given amount
	for(var row=0; row<this.height-amount; row++) {
		this.chars[row] = this.chars[row+amount];
		this.breaks[row] = this.breaks[row+amount];
	}
	
	// Blank out the unset rows
	var insert_before = this.container.lastChild;
	for(var row=this.height-1; row>=this.height-amount; row--) {
		insert_before = this.initialize_row(row, insert_before);
	}
}


// Move the rows in the terminal down the given amount, deleting the excess. Blank rows are
// added to the top as required. 'amount' should be positive.
function move_down(amount) {
	// Check preconditions
	if(amount <= 0) return;
	
	// Delete the excess rows before they become inaccessible
	for(var row=this.height-amount; row<this.height; row++) {
		this.delete_row_tags(row);
	}
	
	// Cycle through the rows and move them down the given amount.
	// Start from the bottom so as not to overwrite any rows.
	for(var row=this.height-1; row>=amount; row--) {
		this.chars[row] = this.chars[row-amount];
		this.breaks[row] = this.breaks[row-amount];
	}
	
	// Blank out the unset rows
	var insert_before = this.chars[amount][0];
	for(var row=amount-1; row>=0; row--) {
		insert_before = this.initialize_row(row, insert_before);
	}
}


// Mappings between SGR color codes to color values. The background and foreground color codes
// are identical barring the offset (30 vs 40).

color_values = [
	// normal      bold
	["#222222", "#000000"], // black
	["#CC0000", "#FF0000"], // red
	["#00CC00", "#00FF00"], // green
	["#DDDD00", "#FFFF00"], // yellow
	["#0000DD", "#00FF00"], // green
	["#CC00CC", "#FF00FF"], // magenta
	["#00DDDD", "#00FFFF"], // cyan
	["#DDDDDD", "#FFFFFF"]  // white
]

foreground_offset = 30;
background_offset = 40;

function get_foreground(color, bold) { 
	return color_values[color-foreground_offset][bold?1:0]; 
}

function get_background(color) { 
	// Backgrounds are always 'bold'
	return color_values[color-background_offset][1]; 
}

// Convert fg code to bg code
function fg_to_bg(color) {
	return color-foreground_offset+background_offset;
}

// Convert bg code to fg code
function bg_to_fg(color) {
	return color-background_offset+foreground_offset;
}


function clear_attributes() {
	this.background = this.default_background;
	this.foreground = this.default_foreground;
	this.bold = false;
	this.text_decoration = "none";
}

function clear_char(x, y) {
	this.set_char_xy(x, y, "&nbsp;");
	this.apply_attributes_xy(x, y,
		this.default_background,
		this.default_foreground,
		false,
		"none"
	);
}


function set_attribute(code) {
	switch(code) {
		case 0: // clear all attributes
			this.clear_attributes();
			break;
		
		case 1: // bold
			this.bold = true;
			break;
			
		case 4: // underline / double underline
		case 21:
			this.text_decoration = "underline";
			break;
	
		case 7: // swap foreground and background colors
			var bg = this.background;
			
			this.background = fg_to_bg(this.foreground);
			this.foreground = bg_to_fg(bg);
			break;
			
		case 9: // strike-through
			this.text_decoration = "line-through";
			break;

		
		case 22: // normal font
			this.bold = false;
			break;
			
		case 24: // no underline/overline/strike-through
		case 29:
		case 55:
			this.text_decoration = "none";
			break;
			
		case 30: // set foreground
		case 31:
		case 32:
		case 33:
		case 34:
		case 35:
		case 36:
		case 37:
			this.foreground = code;
			break;
			
		case 39: // default foreground
			this.foreground = this.default_foreground;
			break;
			
		case 40: // set background
		case 41:
		case 42:
		case 43:
		case 44:
		case 45:
		case 46:
		case 47:
			this.background = code;
			break;
			
		case 49: // default background
			this.background = this.default_background;
			break;
			
		default: // unsupported code
			return code;
	}
	
	return -1;
}


function apply_attributes(background, foreground, bold, text_decoration) {
	this.apply_attributes_xy(this.cursorx, this.cursory,
		background,
		foreground,
		bold,
		text_decoration
	);
}

function apply_attributes_xy(x, y, background, foreground, bold, text_decoration) {
	var style = this.get(x, y).style;
	style.background = get_background(background);
	style.color = get_foreground(foreground, bold);
	
	style.textDecoration = text_decoration;
}


function get() {return this.chars[this.cursory-1][this.cursorx-1];}

function getxy(x, y) {return this.chars[y-1][x-1];}


function set_char(ch) {
	this.get().innerHTML = ch;
}

function set_char_xy(x, y, ch) {
	this.getxy(x, y).innerHTML = ch;
}


function get_char() {
	return this.get().innerHTML;
}

function get_char_xy(x, y) {
	return this.getxy(x, y).innerHTML;
}


function move_cursor(delta_x, delta_y) {
	this.set_x(this.cursorx + delta_x);
	this.set_y(this.cursory + delta_y);
}


function save_cursor() {
	this.savedx = this.cursorx;
	this.savedy = this.cursory;
}

function restore_cursor() {
	if(this.savedx == undefined || this.savedy == undefined) return;
	this.cursorx = this.savedx;
	this.cursory = this.savedy;
}


function set_x(x) {
	this.cursorx = Math.max(Math.min(x, this.width), 1);
}

function set_y(y) {
	this.cursory = Math.max(Math.min(y, this.height), 1);
}


// Fill in part of the screen with spaces, inclusive. y1 needs to be less than y2
function clear(x1, y1, x2,  y2) {

	// Special case if only one row is to be cleared
	if(y1 == y2) {
		for(var x=x1; x<=x2; x++) {
			this.clear_char(x, y1);
		}
	} else {
		// Fill in first line
		for(var x=x1; x<=this.width; x++) {
			this.clear_char(x, y1);
		}
		
		// Fill in the middle
		for(var y=y1+1; y<y2; y++) {
			for(var x=1; x<=this.width; x++) {
				this.clear_char(x, y);
			}
		}
		
		// Fill in last line
		for(var x=1; x<=x2; x++) {
			this.clear_char(x, y2);
		}
	}
}


function newline() {
	if(this.cursory >= this.height) {
		// Scroll the terminal up to make room without deleting the excess
		this.move_up(this.cursory + 1 - this.height, false);
		
		// Keep track of how many non-visible/immutable lines there are
		this.num_excess_lines += this.cursory + 1 - this.height;
	

		// Since the excess is still in its previous spot, move the entire terminal
		// div up the correct amount to compensate.
		this.container.style.top = -this.num_excess_lines*this.line_height + "em";
		
		// Return the cursor to a valid position
		this.cursory = this.height;
	} else {
		this.cursory += 1;
	}
	
	// Reset the cursor's horizontal position to be flush with the left of the terminal
	this.cursorx = 1;
}


function tab() {
	for(var i=0; i<this.tab_size; i++) {
		this.write_char(" ");
	}
}


// Delete the previous character and move the cursor back to it. Do nothing if we're
// at the left margin.
function backspace() {
	// If we can, move the cursor to the left one and delete that character
	if(this.cursorx > 1) {
		this.cursorx -= 1;
		this.set_char("&nbsp;");
	}
}


// Escapes any sensitive chars that might be misinterpreted
function to_html(ch) {
	if(ch == " ") return "&nbsp;";
	if(ch == "<") return "&lt;";
	if(ch == ">") return "&gt;";
	if(ch == "&") return "&amp;";
	return ch;
}

function write_char(ch) {
	this.set_char(to_html(ch));
	this.apply_attributes(
		this.background,
		this.foreground,
		this.bold,
		this.text_decoration
	);
	
	this.cursorx += 1;		
	if(this.cursorx > this.width) {
		this.newline();
	}
}


// Scroll the given amount, - is up, + is down. Don't scroll past the top or bottom
// of the available rows.
function scroll(amount) {
	// Retrieve the current position
	current_position = this.container.style.top.slice(0, -2)*1;
	
	// Adjust the current position the correct result, clamping the results to be valid
	this.container.style.top = Math.min(
		0, 
		Math.max(-this.num_excess_lines*this.line_height, current_position - amount*this.line_height)
	) + "em";
}


// Reset the terminal view to its default state all the way down
function reset_scroll_pos() {
	this.container.style.top = -this.num_excess_lines*this.line_height + "em";
}
