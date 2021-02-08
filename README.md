# Harden Vanilla Puppeteer

A patch to modify some core Puppeteer files to decrease detection rates by switching execution to an isolated world. 

More about isolated worlds here: https://developer.chrome.com/extensions/content_scripts

## Current Patches

> Note: Other versions can apply manually, following the changes in the patch diff files.

#### Puppeteer
- [x] `1.19.0`
- [x] `2.1.1`
- [x] `5.2.1`
- [x] `5.3.1`
- [x] `7.0.1`

#### Puppeteer Core
- [x] `5.3.1`
- [ ] `7.0.1`

## Patching with Patch-Package

1. Install Patch-Package https://github.com/ds300/patch-package 
2. Copy the `patches` folder to your project directory
3. Run `npx patch-package` to apply the changes
4. Run `npx patch-package --reverse` to remove

## What it does

To avoid maintaining a fork of vanilla Puppeteer, the patch makes a few edits to core Puppeteer files within your `node_modules` folder.

The goal is to strip strings that reference Puppeteer which are exposed via throwing a `new Error()` and checking the trace and switch pretty much every call to run in an isolated world (apart from `waitForFunction`).

The patch modifies Puppeteer's `FrameManager` class to automatically create a new Isolated World and use this as the context rather than the default one.

## What files are modified?

##### `ExecutionContext.js`
- Removes sourceURL from `Error` stack inspection.
- There is an evasion in `puppeteer-extra` for this which is worth implementing as well as it is likely more robust.
     
##### `FrameManager.js`
- Remove the reference to puppeteer in the utility world name.
- Overwrite basically every call to the unprotected `_mainWorld` with `_secondaryWorld` except for `evaluate()`, `$eval()`, `waitForFunction()`.
  
##### `Launcher.js`
- Remove reference to puppeteer in the Chrome profile name.
- Remove reference to puppeteer in the Firefox profile name.

## How to reverse

If using Patch-Package running `patch-package --reverse` should work.

```bash
$ npx patch-package --reverse;
```

If manually editing your files, just delete your `node_modules` folder and run `npm install` again.

```bash
$ rm -rf ./node_modules; npm install;
```

## Test
If you'd like to create a test to check if your code is detectable, there is a basic starting point here:

- Puppeteer Test: https://github.com/prescience-data/puppeteer-botcheck/blob/b6848845b8b5887608784caa2fe7a078db866e9b/Botcheck.js#L45
- Host Monitoring Execution: https://github.com/prescience-data/prescience-data.github.io/blob/master/execution-monitor.html
- URL of the live test: https://prescience-data.github.io/execution-monitor.html

Here's the differences between unpatched and patched:

##### Unpatched:
![Unpatched](https://user-images.githubusercontent.com/65471523/107285213-f0b44100-6ab2-11eb-9b6e-ec983a3d0ec4.png)
 
##### Patched:

![Patched](https://user-images.githubusercontent.com/65471523/107285220-f447c800-6ab2-11eb-8d6a-016d7f3da80e.png)

The patched version still runs any scripts injected via `page.evaluateOnNewDocument()` in the `_mainWorld` so watch for that.

However, everything else is running in the `_isolatedWorld` and outside the security scope of detection scripts monitoring execution.

The existing page scripts will continue to run as normal in the Main World and will appear to function as normal (which is good), but you will no longer be able to interact with on-page scripts (which might be bad, depending on your use-case).

Naturally, they would be able to observe changes you make to the DOM, but only the **outcome**, not *how* the execution is occurring. Consider the implications of this before using.
