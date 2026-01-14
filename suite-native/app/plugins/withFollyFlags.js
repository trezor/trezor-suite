const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withPodsFollyNoCoroutines(config) {
    return withDangerousMod(config, [
        'ios',
        cfg => {
            const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
            let podfile = fs.readFileSync(podfilePath, 'utf8');

            const marker = '### FOLLY_NO_COROUTINES_FOR_PODS';
            if (podfile.includes(marker)) return cfg;

            const snippet = `
  # ${marker}
# Prevents Folly from including the missing \`folly/coro/Coroutine.h\` header.
# Required for React Native New Architecture when building C++ Pods
# (e.g. @emurgo/csl-mobile-bridge) to match Folly flags used by the app target. https://github.com/facebook/folly/issues/2297
  installer.pods_project.build_configurations.each do |config|
    flags = config.build_settings['OTHER_CPLUSPLUSFLAGS']
    flags = ['$(inherited)'] if flags.nil?
    flags = [flags] if flags.is_a?(String)
    flags << '-DFOLLY_CFG_NO_COROUTINES=1' unless flags.include?('-DFOLLY_CFG_NO_COROUTINES=1')
    config.build_settings['OTHER_CPLUSPLUSFLAGS'] = flags
  end
`;

            podfile = podfile.replace(/post_install do \|installer\|\n/, m => m + snippet);

            fs.writeFileSync(podfilePath, podfile);

            return cfg;
        },
    ]);
};
