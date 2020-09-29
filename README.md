# Harden Vanilla Puppeteer
A patch to modify some core Puppeteer files to decrease detection rates by switching execution to an isolated world. 

More about isolated worlds here: https://developer.chrome.com/extensions/content_scripts

### Patching with Patch-Package

Patches available for `puppeteer` `1.19.0`, `2.1.1`, `5.2.1`, `5.3.1` & `puppeteer-core` `5.3.1` 

(Note: Other versions can apply manually, following the changes in the patch diff files.)

- Install Patch-Package https://github.com/ds300/patch-package 
- Copy the `patches` folder to your project directory
- Run `npx patch-package` to apply the changes
- Run `npx patch-package --reverse` to remove

### What it does

To avoid maintaining a fork of vanilla Puppeteer, the patch makes a few edits to core Puppeteer files within your `node_modules` folder.

The goal is to strip strings that reference Puppeteer which are exposed via throwing a `new Error()` and checking the trace and switch pretty much every call to run in an isolated world (apart from `waitForFunction`).

The patch modifies Puppeteer's `FrameManager` class to automatically create a new Isolated World and use this as the context rather than the default one.

### What files are modified?

##### `ExecutionContext.js`
- Change the name of the script src exposed in `new Error()` to a random common script name.
- Add some attributes `_isIsolated` and `_contextName` to help detect if isolated or not.
- Additional script names can be added by modifying https://github.com/prescience-data/harden-puppeteer/blob/master/patches/puppeteer%2B5.2.1.patch#L10
- There is an evasion in `puppeteer-extra` which is worth implementing as well as it is likely more robust.
     
##### `FrameManager.js`
- Remove the reference to puppeteer in the utility world name potentially exposed via `new Error()`.
- Add a new `DOMWorld` called `_isolatedWorld` and call `_ensureIsolatedWorld()` to isolate it.
- Overwrite basically every call to the unprotected `_mainWorld` with `_isolatedWorld` except for `waitForFunction()`.
  
##### `Launcher.js`
- Remove reference to puppeteer in the Chrome profile name.
- Remove reference to puppeteer in the Firefox profile name.

### How to reverse

If using Patch-Package running `patch-package --reverse` should work.

```bash
$ npx patch-package --reverse;
```

If manually editing your files, just delete your `node_modules` folder and run `npm install` again.

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

The existing page scripts will continue to run as normal in the Main World and will appear to function as normal (which is good), but you will no longer be able to interact with on-page scripts (which might be bad, depending on your use-case).

Naturally, they would be able to observe changes you make to the DOM, but only the **outcome**, not *how* the execution is occurring. Consider the implications of this before using.
