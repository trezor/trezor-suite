import { mock } from '@suite-common/dependency-injection';

import { type BluetoothServiceCommon } from '../src';

export const mockBluetoothServiceCommon = (): BluetoothServiceCommon => ({
    restartBackgroundScan: mock<BluetoothServiceCommon['restartBackgroundScan']>(),
});
