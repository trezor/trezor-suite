/*
 * This plugin is used to replace generated .xcode.env.local file with .xcode.env file.
 * This is needed because the generated .xcode.env.local file for some reason contains wrong path to Node.js binary.
 */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable require-await */
const { withDangerousMod, withPlugins } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

async function readFile(path) {
    return fs.promises.readFile(path, 'utf8');
}

async function saveFile(path, content) {
    return fs.promises.writeFile(path, content, 'utf8');
}

module.exports = config =>
    withPlugins(config, [
        config =>
            withDangerousMod(config, [
                'ios',
                async config => {
                    const file = path.join(config.modRequest.platformProjectRoot, '.xcode.env');
                    const fileLocal = path.join(
                        config.modRequest.platformProjectRoot,
                        '.xcode.env.local',
                    );

                    const contents = await readFile(file);

                    /*
                     * Now re-adds the content
                     */
                    await saveFile(fileLocal, contents);

                    return config;
                },
            ]),
    ]);
