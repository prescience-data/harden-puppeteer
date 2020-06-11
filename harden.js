const fs = require('fs');

/**
 * Provide the list of weak files and a list of replacement tokens.
 */

const files = [
	{
		/**
		 * This is the most heavily modified file as it is the termination point for all Puppeteer DOM interactions.
		 * List of changes:
		 *  1. Change the name of the script src exposed in new Error() to something common.
		 *  2. Override the passed contextPayload id and create a new attribute for the isolated context.
		 *  3. Add an async method to create a new isolated world if not already created.
		 *  4. Add a line to _evaluateInternal to generate a new isolated context id if not generated.
		 */
		path: './node_modules/puppeteer/lib/ExecutionContext.js',
		replacements: [
			{
				search: /__puppeteer_evaluation_script__/g,
				replacement: 'jquery'
			},
			{
				search: /this._contextId = contextPayload.id;/g,
				replacement: `this._contextId = null; this._iso = null;`
			},
			{
				search: /class ExecutionContext {/g,
				replacement: `class ExecutionContext {
				/* Inserted Function */
				async createNewIsolatedContext() { 
					if (!this._iso && this.frame()) {
						const worldName = 'w' + process.hrtime.bigint();
						this._iso = await this._client.send('Page.createIsolatedWorld', { frameId: this.frame()._id, grantUniveralAccess: true, worldName: worldName });
						this._contextId = this._iso.executionContextId;
					}
				}
				`
			},
			{
				search: /async _evaluateInternal\(returnByValue, pageFunction, \.\.\.args\) {/g,
				replacement: `async _evaluateInternal(returnByValue, pageFunction, ...args) { 
				if (!this._contextId) { await this.createNewIsolatedContext(); }
				`
			},
		]
	},
	/**
	 * Remove the reference to puppeteer in the script src potentially exposed via new Error()
	 */
	{
		path: './node_modules/puppeteer/lib/FrameManager.js',
		replacements: [
			{
				search: /__puppeteer_utility_world__/g,
				replacement: 'utility_world'
			}
		]
	},
	/**
	 * Remove reference to puppeteer in the profile name.
	 */
	{
		path: './node_modules/puppeteer/lib/Launcher.js',
		replacements: [
			{
				search: /puppeteer_dev_profile/g,
				replacement: 'default_profile'
			}
		]

	}
];

/**
 * Loop through the file list and insert or replace the hardened strings & functions
 * to the core puppeteer files.
 * The script will add a tag to avoid attempting to modify more than once.
 *
 */

files.forEach(file => {
	fs.readFile(file.path, 'utf8', function (err, data) {

		if (err) {
			return console.log(err);
		}
		console.log('Attempting file "' + file.path + '"');

		// Check if already hardened
		if (!data.includes('Is Hardened')) {

			let result = data;

			// Loop through the replacements provided and edit the file as needed
			file.replacements.forEach(replacement => {
				console.log('Replacing "' + replacement.search + '"');
				result = result.replace(replacement.search, replacement.replacement);
			});

			// Add a completion tag at the start of the script
			result = '/* Is Hardened */ \r\n' + result;

			// Write the file back to the puppeteer node_modules folder
			fs.writeFile(file.path, result, 'utf8', function (err) {
				if (err) {
					return console.log(err);
				}
			});

			console.log('Success!');
		}
		else {
			console.log('Already hardened, skipping...');
		}

	});
});

