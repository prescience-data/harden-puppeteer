const { existsSync, readFileSync, writeFileSync } = require("fs")

/**
 * Universal monkey-patch for srcdoc evasion.
 * Handled already if using a patch, but if you just need to strip the string in your package, this is more accessible.
 * @example
 *  In package.json as a user script:
 *  "scripts": {
 *      "patch-puppeteer": "./patch/bin/run"
 *  }
 * @param root
 * @param replacement
 */
module.exports = patch = (root = process.cwd(), replacement = "") => {
    // Handle both variants of puppeteer.
    const versions = new Set(["puppeteer", "puppeteer-core"])
    for (const version of versions) {
        try {
            // Set the file path to target ExecutionContext.js, default root is your app root.
            const filePath = `${root}/node_modules/${version}/lib/cjs/puppeteer/common/ExecutionContext.js`
            // Check file exists before attempting rewrite.
            if (existsSync(filePath)) {
                // Load file and replace srcdoc string.
                const content = readFileSync(filePath, "utf8")
                const result = content.replace(/__puppeteer_evaluation_script__/g, replacement)
                writeFileSync(filePath, result, "utf8")
            }
        } catch (err) {
            console.log(err.message)
        }
    }
}
