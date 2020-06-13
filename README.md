# Harden Vanilla Puppeteer
An conceptual patch to modify some vanilla puppeteer files to decrease detection rates.

Attempts to address https://github.com/puppeteer/puppeteer/issues/2671

### Disclaimer
This is just an intial concept sketch for feedback in the main Puppeteer-Extra https://github.com/berstend/puppeteer-extra repo, I have no idea if it actually works as intended or what it might break, so use at your own risk.

### Patching with Patch-Package

_Compatible with Puppeteer 1.19.0 (newer TS versions should apply manually)_

- Install Patch-Package https://github.com/ds300/patch-package 
- Copy the `patches` folder to your project directory
- Run `node patch-package` to apply the changes
- Run `node patch-package --reverse` to remove

### What it does

To avoid maintaining a fork of vanilla Puppeteer, the patch makes a few edits to core Puppeteer files within your `node_modules` folder.

The goal is to strip strings that reference Puppeteer which are exposed via throwing a `new Error()` and checking the trace and switch pretty much every call to run in an isolated world (apart from `waitForFunction`).

The patch modifies Puppeteer's `FrameManager` class to automatically create a new Isolated World and use this as the context rather than the default one.

### What files are modified?

##### `ExecutionContext.js`
- Change the name of the script src exposed in `new Error()` to something common.
- Add some attributes to help detect if isolated or not.
     
##### `FrameManager.js`
- Remove the reference to puppeteer in the utility world name potentially exposed via `new Error()`.
- Add a new `DOMWorld` called `_isolatedWorld` and call `_ensureIsolatedWorld()` to isolate it.
- Overwrite basically every call to the unprotected `_mainWorld` with `_isolatedWorld` except for `waitForFunction()` (let me know if this is unnessecarily exposed?).
  
##### `Launcher.js`
- Remove reference to puppeteer in the Chrome profile name.


### Additional suggestions

This appears to be a good method to counter the `new Error()` detection approach as well:
https://github.com/berstend/puppeteer-extra/issues/209#issuecomment-642988817

### How to reverse

If using Patch-Package running `node patch-package --remove` should work.

If manually editing your files, just delete your `node_modules` folder and run `npm install` again.

For example: 
```bash
$ rm -rf ./node_modules; npm install;
```


