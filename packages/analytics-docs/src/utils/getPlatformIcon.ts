import { DesktopIcon, DesktopTowerIcon, DeviceMobileIcon } from '@trezor/icons';

export const getPlatformIcon = (platform: string) => {
    switch (platform) {
        case 'mobile':
            return DeviceMobileIcon;
        case 'desktop':
            return DesktopIcon;
        default:
            return DesktopTowerIcon;
    }
};
