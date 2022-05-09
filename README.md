# POC Browser Terminal

Built on xterm with some higher level helpers and basic UX that you might expect like accepting input, copy/paste, history, etc...

Comes with a (currently broken / unfinished) git implementation via [wasm-git](https://github.com/petersalomonsen/wasm-git). The implementation is broken on my end, not the package. But it exists here to show the addon interface and how you might extend this tool to add commands for the terminal.

## Development

Clone this repository and install dependencies `npm i`. Run the web server and [open the browser](http://localhost:9000/) to see it in action `npx webpack serve`.
