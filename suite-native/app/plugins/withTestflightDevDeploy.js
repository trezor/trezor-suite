/**
 * This file is based on the work of Max Bäumle (@343max)
 * from the repository: https://github.com/343max/testflight-dev-deploy
 *
 * Many thanks to Max for sharing this code with the community!
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs').promises;
const path = require('path');

const podfilePatch = [
    '',
    'key_command_path = File.join(__dir__, "../node_modules/react-native/React/Base/RCTKeyCommands.m")',
    'file_content = File.read(key_command_path)',
    'file_content.sub!(/#if RCT_DEV/, "#if 0")',
    'File.write(key_command_path, file_content)',
    'puts "Patched RCTKeyCommands.m to disable key commands in dev mode"',
    '',
]
    .map(s => `    ${s}`)
    .join('\n');

// Allow development client on Testflight
const withTestflightDevDeploy = (config, { enabled = false }) => {
    withDangerousMod(config, [
        'ios',
        async config2 => {
            if (!enabled) {
                return config2;
            }

            const podfilePath = path.join(config2.modRequest.platformProjectRoot, 'Podfile');

            const code = await fs.readFile(podfilePath, { encoding: 'utf-8' });
            const patchedCode = code.replace(
                /^\s*post_install do \|installer\|/m,
                match => `${match}\n${podfilePatch}`,
            );
            await fs.writeFile(podfilePath, patchedCode);

            return config2;
        },
    ]);

    return config;
};

module.exports = withTestflightDevDeploy;
