import { resolveStaticPath } from '@suite-utils/build';
// switch favicon if dark mode
export const switchFavicon = () => {
    const icon = document.querySelector('link[rel=icon]');
    const appleIcon = document.querySelector('link[rel=apple-touch-icon]');
    const switchIcons = (isDarkMode: boolean) => {
        if (isDarkMode) {
            icon?.setAttribute('href', resolveStaticPath('/images/icons/favicon/favicon_dm.png'));
            appleIcon?.setAttribute(
                'href',
                resolveStaticPath('/images/icons/favicon/favicon_dm.png'),
            );
        } else {
            icon?.setAttribute('href', resolveStaticPath('/images/icons/favicon/favicon.png'));
            appleIcon?.setAttribute('href', resolveStaticPath('/images/icons/favicon/favicon.png'));
        }
    };
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');

    // not supported in IE
    if (matchMedia?.addEventListener) {
        matchMedia.addEventListener('change', e => switchIcons(e.matches));
    }
    switchIcons(window.matchMedia('(prefers-color-scheme: dark)').matches);
};
