# Harden Vanilla Puppeteer
An conceptual patch to modify some vanilla puppeteer files to decrease detection rates.

Attempts to address https://github.com/puppeteer/puppeteer/issues/2671

### Disclaimer
This is just an intial concept sketch for feedback in the main Puppeteer-Extra https://github.com/berstend/puppeteer-extra repo, I have no idea if it actually works as intended or what it might break, so use at your own risk.

### Patching with Patch-Package

_Compatible with Puppeteer 1.19.0 and 2.1.0 (newer TS versions should apply manually, however an untested 5.2.1 patch is available)

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
- Add some attributes `_isIsolated` and `_contextName` to help detect if isolated or not.
     
##### `FrameManager.js`
- Remove the reference to puppeteer in the utility world name potentially exposed via `new Error()`.
- Add a new `DOMWorld` called `_isolatedWorld` and call `_ensureIsolatedWorld()` to isolate it.
- Overwrite basically every call to the unprotected `_mainWorld` with `_isolatedWorld` except for `waitForFunction()` (let me know if this is unnessecarily exposed?).
  
##### `Launcher.js`
- Remove reference to puppeteer in the Chrome profile name.
- Remove reference to puppeteer in the Firefox profile name.

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

### Test
If you'd like to create a test to check if your code is detectable, there is a basic starting point here:

- Puppeteer Test: https://github.com/prescience-data/puppeteer-botcheck/blob/b6848845b8b5887608784caa2fe7a078db866e9b/Botcheck.js#L45
- Host Monitoring Execution: https://github.com/prescience-data/prescience-data.github.io/blob/master/execution-monitor.html
- URL of the live test: https://prescience-data.github.io/execution-monitor.html

Here's the differences between unpatched and patched:

![comparison](https://github.com/prescience-data/harden-puppeteer/blob/master/comparison.jpg?raw=true)

You can see that the patched version only detects the inserted elements (which was left deliberately unisolated to allow user to inject scripts into the main context (ie all the extra-stealth modifications).

However, anything other than that is running isolated and outside the security scope of any bot detection script.

Naturally they would be able to observe changes you make to the DOM, but only the **outcome**, not *how* the execution is occurring.
