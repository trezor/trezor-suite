import { mock } from '@trezor/dependency-injection';

import { type BackgroundScan } from '../src/bluetoothBackgroundScan';

export const mockBackgroundScan = () => ({
    start: mock<BackgroundScan['start']>(),
    stop: mock<BackgroundScan['stop']>(),
    restartIfNeeded: mock<BackgroundScan['restartIfNeeded']>(),
});
