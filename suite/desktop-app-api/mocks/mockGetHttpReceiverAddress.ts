import { mock } from '@suite-common/dependency-injection';

import { type DesktopApi } from '../src/api';

export const mockGetHttpReceiverAddress = (address = 'http://localhost:21325') =>
    mock<DesktopApi['getHttpReceiverAddress']>(() => Promise.resolve(address));
