import { Platform } from '@suite-types';

export const getPlatform = (navigator: Navigator): Platform => {
    const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    if (macPlatforms.includes(navigator.platform)) {
        return 'mac';
    }
    if (windowsPlatforms.includes(navigator.platform)) {
        return 'windows';
    }
    if (/Linux/.test(navigator.platform)) {
        return 'linux';
    }
    return undefined;
};
