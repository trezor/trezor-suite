import { resolveConfig } from 'detox/internals';

const LAUNCH_ARGS = {
    //Do not synchronize communication over the trezor bridge
    detoxURLBlacklistRegex: '\\("^.*127.0.0.1.*"\\)',
};

const platform = device.getPlatform();

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const getExpoDeepLinkUrl = () => {
    const expoLauncherUrl = encodeURIComponent(
        // `http://dp5mkti-petr.knetl-8081.exp.direct/index.bundle?platform=${platform}&dev=true&minify=false&disableOnboarding=1`,
        `http://localhost:8081/index.bundle?platform=${platform}&dev=true&minify=false&disableOnboarding=1`,
    );

    return `exp://expo-development-client/?url=${expoLauncherUrl}`;
};

const openExpoDevClientApp = async () => {
    const deepLinkUrl = getExpoDeepLinkUrl();

    device.reverseTcpPort(21325);

    if (platform === 'ios') {
        await device.launchApp({
            newInstance: true,
            launchArgs: LAUNCH_ARGS,
        });
        await sleep(3000);
        await device.openURL({
            url: deepLinkUrl,
        });
    } else {
        await device.launchApp({
            newInstance: true,
            url: deepLinkUrl,
            launchArgs: LAUNCH_ARGS,
        });
    }

    await sleep(3000);
};

// Inspired by Expo E2E detox-tests guide:
// See more: https://docs.expo.dev/build-reference/e2e-tests/#e2eutilsopenappjs-new-file
export const openApp = async () => {
    const { configurationName } = await resolveConfig();

    const isDebugTestBuild = configurationName.split('.')[2] === 'debug';

    if (isDebugTestBuild) {
        await openExpoDevClientApp();
    } else {
        await device.launchApp({
            newInstance: true,
            launchArgs: LAUNCH_ARGS,
        });
    }
};
