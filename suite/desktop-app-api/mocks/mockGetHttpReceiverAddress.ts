import { mock } from '@trezor/dependency-injection';

import { type DesktopApi, type HttpReceiverAddress } from '../src/api';

export const mockGetHttpReceiverAddress = (
    address: HttpReceiverAddress = { url: 'http://localhost:21325', token: '' },
) => mock<DesktopApi['getHttpReceiverAddress']>(() => Promise.resolve(address));
