import type { ConnectSettings } from '@trezor/connect-common/src/types';

import type { Response } from '../params';

export declare function getSettings(): Response<ConnectSettings>;
