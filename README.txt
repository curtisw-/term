This is a fully functional, ANSI-compatible terminal emulator written in Javascript with example usage. A terminal emulator is an application which formats and displays raw standard output from a program in accordance with the formatting codes present in said output. Trivially, it also sends text and special codes to the program as standard input. Initially, I intended this to be the frontend for an SSH webapp (to be used on, for example, library computers without an SSH client), but I realized the impracticality of it after completing the javascript side.

There are two ways to interact with the terminal in the example provided. Simple text may be entered in the terminal by simply clicking on it and typing. If you wish to provide escape codes, for example to change text color, background color, the location of the cursor, etc., you must use the raw input box below the terminal. The full list of escape codes supported is in escape_codes.js. Here are some examples:

\x1b[1m    - set the bold attribute
\x1b[31m   - set the foreground color; change the 31 to be 30-39 for different colors (30 is black)
\x1b[41m   - set the background color; change the 41 to be 40-49 for different colors (40 is black)
\x1b[2J    - clear the terminal

*** WARNING - this code is 6 years old, well before I had realized the convenience of jQuery ***
