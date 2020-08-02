# Harden Vanilla Puppeteer
An patch to modify some core puppeteer files to decrease detection rates by switching execution to an isolated world. 

More about isolated worlds here: https://developer.chrome.com/extensions/content_scripts

### Patching with Patch-Package

_Compatible with Puppeteer 1.19.0, 2.1.0, and 5.2.1 (other versions should apply manually, following the changes)

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
- Change the name of the script src exposed in `new Error()` to a random common script name.
- Add some attributes `_isIsolated` and `_contextName` to help detect if isolated or not.
     
##### `FrameManager.js`
- Remove the reference to puppeteer in the utility world name potentially exposed via `new Error()`.
- Add a new `DOMWorld` called `_isolatedWorld` and call `_ensureIsolatedWorld()` to isolate it.
- Overwrite basically every call to the unprotected `_mainWorld` with `_isolatedWorld` except for `waitForFunction()`.
  
##### `Launcher.js`
- Remove reference to puppeteer in the Chrome profile name.
- Remove reference to puppeteer in the Firefox profile name.

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

##### Unpatched:
![Unpatched](https://github.com/prescience-data/harden-puppeteer/blob/master/isolated_unpatched.jpg?raw=true)
##### Patched:
![Patched](https://github.com/prescience-data/harden-puppeteer/blob/master/isolated_patched.jpg?raw=true)

The patched version still runs any scripts injected via `page.evaluateOnNewDocument()` in the `_mainWorld` so watch for that.

However, everything else is running in the `_isolatedWorld` and outside the security scope of detection scripts monitoring execution.

Naturally, they would be able to observe changes you make to the DOM, but only the **outcome**, not *how* the execution is occurring.
