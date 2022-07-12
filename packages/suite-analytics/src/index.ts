import { Analytics } from '@trezor/analytics';

import { VERSION } from './constants';
import type { SuiteAnalyticsEvent } from './types/events';

const analytics = new Analytics<SuiteAnalyticsEvent>(VERSION, 'suite');

export { analytics };
export * from './types/definitions';
export * from './types/events';
export * from './constants';
