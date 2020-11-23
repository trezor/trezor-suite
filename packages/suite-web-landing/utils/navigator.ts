export type Platform = 'linux-arm64' | 'linux-x86_64' | 'mac-x86_64' | 'win-x86_64';

export const getPlatform = (navigator: Navigator): Platform => {
    const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    if (macPlatforms.includes(navigator.platform)) {
        return 'mac-x86_64';
    }
    if (windowsPlatforms.includes(navigator.platform)) {
        return 'win-x86_64';
    }
    if (navigator.platform.includes('aarch64')) {
        return 'linux-arm64';
    }
    return 'linux-x86_64';
};
