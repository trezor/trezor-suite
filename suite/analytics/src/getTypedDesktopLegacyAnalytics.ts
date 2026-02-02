import { Analytics } from '@trezor/analytics-uploader';

// @TODO: we have to type dispatch correctly in desktop/native/common
export const getTypedDesktopLegacyAnalytics = (legacyAnalytics: Analytics<any>) => legacyAnalytics;
