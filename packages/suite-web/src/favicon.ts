const assetPrefix = process.env.ASSET_PREFIX ?? '';
const faviconLight = `${assetPrefix}/static/images/favicons/favicon.png`;
const faviconDark = `${assetPrefix}/static/images/favicons/favicon_dm.png`;

/**
 * Set favicon according to current system theme
 */
function updateFaviconHandler(event: MediaQueryListEvent | MediaQueryList) {
    const isDarkMode = event.matches;
    const icon = document.querySelector('link[rel=icon]');
    const appleIcon = document.querySelector('link[rel=apple-touch-icon]');

    if (isDarkMode) {
        icon?.setAttribute('href', faviconDark);
        appleIcon?.setAttribute('href', faviconDark);
    } else {
        icon?.setAttribute('href', faviconLight);
        appleIcon?.setAttribute('href', faviconLight);
    }
}

if (window.matchMedia) {
    const matchedMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    matchedMediaQuery.addEventListener('change', updateFaviconHandler);

    updateFaviconHandler(matchedMediaQuery);
}
