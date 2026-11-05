/*
 * This plugin is used to replace generated .xcode.env.local file with .xcode.env file.
 * This is needed because the generated .xcode.env.local file for some reason contains wrong path to Node.js binary.
 */
/* eslint-disable require-await */
const { withDangerousMod, withPlugins } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

async function readFile(path2) {
    return fs.promises.readFile(path2, 'utf8');
}

async function saveFile(path2, content) {
    return fs.promises.writeFile(path2, content, 'utf8');
}

module.exports = config =>
    withPlugins(config, [
        config2 =>
            withDangerousMod(config2, [
                'ios',
                async config3 => {
                    const file = path.join(config3.modRequest.platformProjectRoot, '.xcode.env');
                    const fileLocal = path.join(
                        config3.modRequest.platformProjectRoot,
                        '.xcode.env.local',
                    );

                    const contents = await readFile(file);

                    /*
                     * Now re-adds the content
                     */
                    await saveFile(fileLocal, contents);

                    return config3;
                },
            ]),
    ]);
