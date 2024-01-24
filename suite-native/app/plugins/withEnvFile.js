/*
 * This plugin is used to generate correct .env file during expo prebuild.
 */
/* eslint-disable @typescript-eslint/no-shadow */
const { withDangerousMod, withPlugins } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

async function replaceEnvFile(config, { buildType }) {
    const baseFilePath = path.join(config.modRequest.projectRoot, `.env.${buildType}`);
    const targetFilePath = path.join(config.modRequest.projectRoot, '.env');

    const baseFileContent = await fs.promises.readFile(baseFilePath, 'utf8');

    await fs.promises.writeFile(targetFilePath, baseFileContent, 'utf8');
    return config;
}

module.exports = (config, { buildType }) =>
    withPlugins(config, [
        config =>
            withDangerousMod(config, ['ios', config => replaceEnvFile(config, { buildType })]),
        config =>
            withDangerousMod(config, ['android', config => replaceEnvFile(config, { buildType })]),
    ]);
