import { Analytics, QueuedAnalytics } from '@trezor/analytics-uploader';

export type DesktopLegacyAnalyticsDep = {
    legacyAnalytics: Analytics<any>;
};

/** @deprecated use `createAnalytics` instead */
export const createLegacyAnalytics = (): Analytics<any> =>
    new QueuedAnalytics<any>({
        version: process.env.VERSION!,
        app: 'suite',
        useQueue: true,
    });
