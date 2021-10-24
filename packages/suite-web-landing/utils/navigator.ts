export type Platform = 'linux-arm64' | 'linux-x86_64' | 'mac-x64' | 'mac-arm64' | 'win-x64';

export const getPlatform = (navigator: Navigator): Platform => {
    const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    if (macPlatforms.includes(navigator.platform)) {
        // https://stackoverflow.com/questions/65146751/detecting-apple-silicon-mac-in-javascript
        const w = document.createElement('canvas').getContext('webgl');
        if (w) {
            const d = w.getExtension('WEBGL_debug_renderer_info');
            const g = (d && w.getParameter(d.UNMASKED_RENDERER_WEBGL)) || '';
            if (g.match(/Apple/) && !g.match(/Apple GPU/)) {
                // "Apple GPU" is returned on both platforms.
                // If it's something else starting with "Apple" (e.g. "Apple M1")
                // we can be sure it is Apple Silicon.
                return 'mac-arm64';
            }
        }
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
