# Harden Vanilla Puppeteer
An atrociously hacky script to modify some vanilla puppeteer files to decrease detection rates.

Attempts to address https://github.com/puppeteer/puppeteer/issues/2671

### Patching with Patch-Package

_Compatible with Puppeteer 1.19.0 (newer TS versions should apply manually)_

- Install Patch-Package https://github.com/ds300/patch-package 
- Copy the `patches` folder to your project directory
- Run `node patch-package` to apply the changes
- Run `node patch-package --reverse` to remove

### What it does

To avoid maintaining a fork of vanilla Puppeteer, the script makes a few edits to core Puppeteer files within your `node_modules` folder.

The goal is to strip strings that reference Puppeteer which are exposed via throwing a `new Error()` and checking the trace.

More importantly _(and which theoretically should avoid the need for the above changes)_ the patch modifies Puppeteer's `ExecutionContext` class to automatically create a new IsolatedWorld and use this as the context rather than the one passed in.

### What files are modified?

##### `ExecutionContext.js`
  This is the most heavily modified file as it is the termination point for all Puppeteer DOM interactions.
  
  List of changes:
  
  - Change the name of the script src exposed in `new Error()` to something common.
  - Override the passed `contextPayload` id and create a new attribute for the isolated context.
  - Add an async method to create a new isolated world if not already created.
  - Add a line to `_evaluateInternal` to generate a new isolated context id if not generated.
     
##### `FrameManager.js`
  Remove the reference to puppeteer in the script src potentially exposed via `new Error()`
  
##### `Launcher.js`
  Remove reference to puppeteer in the profile name

### Main function

The main change that attempts to create the Isolated World is demonstrated in an example of the modified `ExecutionContext.js` file here: https://github.com/prescience-data/harden-puppeteer/blob/master/ExecutionContext-Patched.js


### How to reverse

If using Patch-Package running `node patch-package --remove` should work.

If manually editing your files, just delete your `node_modules` folder and run `npm install` again.

For example: 
```bash
$ rm -rf ./node_modules; npm install;
```

### Disclaimer
This is just an intial concept sketch for feedback in the main Puppeteer-Extra https://github.com/berstend/puppeteer-extra repo, I have no idea if it actually works as intended or what it might break, so use at your own risk.

