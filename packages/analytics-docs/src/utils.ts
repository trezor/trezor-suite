export const getPlatformIcon = (platform: string) => {
    switch (platform) {
        case 'mobile':
            return 'deviceMobile';
        case 'desktop':
            return 'desktop';
        default:
            return 'desktopTower';
    }
};
