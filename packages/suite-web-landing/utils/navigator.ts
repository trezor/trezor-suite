export type Platform = 'linux-arm64' | 'linux-x86_64' | 'mac-x64' | 'mac-arm64' | 'win-x64';

export const getPlatform = (navigator: Navigator): Platform => {
    const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    if (macPlatforms.includes(navigator.platform)) {
        // navigator.platform returns "MacIntel" on Apple Silicon too
        // so let's always return "mac-x64" for now
        return 'mac-x64';
    }
    if (windowsPlatforms.includes(navigator.platform)) {
        return 'win-x64';
    }
    if (navigator.platform.includes('aarch64')) {
        return 'linux-arm64';
    }
    return 'linux-x86_64';
};
