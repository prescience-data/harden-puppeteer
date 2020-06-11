# Harden Vanilla Puppeteer
An atrociously hacky script to modify some vanilla puppeteer files to decrease detection rates.

Attempts to address https://github.com/puppeteer/puppeteer/issues/2671

### What it does

To avoid maintaining a fork of vanilla Puppeteer, the script makes a few edits to core Puppeteer files within your `node_modules` folder.

The goal is to strip strings that reference Puppeteer which are exposed via throwing a `new Error()` and checking the trace.

More importantly _(and which theoretically should avoid the need for the above changes)_ the script modifies Puppeteer's `ExecutionContext` class to automatically create a new IsolatedWorld and use this as the context rather than the one passed in.

The script will loop through a list of weak files and insert or replace the hardened strings & functions to the core puppeteer files.
Additionally, it will add a tag to avoid attempting to modify more than once.

### What files are modified?

#### `ExecutionContext.js`
  This is the most heavily modified file as it is the termination point for all Puppeteer DOM interactions.
  
  List of changes:
  
  - Change the name of the script src exposed in `new Error()` to something common.
  - Override the passed `contextPayload` id and create a new attribute for the isolated context.
  - Add an async method to create a new isolated world if not already created.
  - Add a line to `_evaluateInternal` to generate a new isolated context id if not generated.
     
#### `FrameManager.js`
  Remove the reference to puppeteer in the script src potentially exposed via `new Error()`
  
##### `Launcher.js`
  Remove reference to puppeteer in the profile name

### Main function

The change that attempts to create the Isolated World is demonstrated in an example of the modified `ExecutionContext.js` file here: https://github.com/prescience-data/harden-puppeteer/blob/master/ExecutionContext-Demo.js


Look for the `/* ######## Inserted ######### /*` comments on lines:
- https://github.com/prescience-data/harden-puppeteer/blob/master/ExecutionContext-Demo.js#L25
- https://github.com/prescience-data/harden-puppeteer/blob/master/ExecutionContext-Demo.js#L42
- https://github.com/prescience-data/harden-puppeteer/blob/master/ExecutionContext-Demo.js#L79



### How to reverse

Just delete your `node_modules` folder and run `npm install` again.

For example: 
```bash
$ rm -rf ./node_modules; npm install;
```

### Disclaimer
This is just an intial concept sketch for feedback in the main Puppeteer-Extra https://github.com/berstend/puppeteer-extra repo, I have no idea if it actually works as intended or what it might break, so use at your own risk.

