import { Analytics, getRandomId } from '@trezor/analytics';

import type { ConnectExplorerAnalyticsEvent } from './events';

const analytics = new Analytics<ConnectExplorerAnalyticsEvent>({
    version: process.env.VERSION!,
    app: 'connect-explorer',
    useQueue: true,
});

export { analytics, getRandomId };
export * from './events';
