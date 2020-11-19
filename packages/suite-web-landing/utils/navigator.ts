export type Platform = 'linux-arm64' | 'linux-x86_64' | 'mac' | 'win';

export const getPlatform = (navigator: Navigator): Platform => {
    const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    if (macPlatforms.includes(navigator.platform)) {
        return 'mac';
    }
    if (windowsPlatforms.includes(navigator.platform)) {
        return 'win';
    }
    if (navigator.platform.includes('aarch64')) {
        return 'linux-arm64';
    }
    return 'linux-x86_64';
};
