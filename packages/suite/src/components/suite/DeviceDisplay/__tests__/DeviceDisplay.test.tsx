import { configureMockStore } from '@suite-common/test-utils';
import { prepareDeviceReducer } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/connect';
import { DeepPartial } from '@trezor/type-utils';

import { DisplayMode } from '../../../../types/suite';
import { DeviceDisplay } from '../DeviceDisplay';
import { renderWithProviders } from '../../../../support/tests/hooksHelper';
import { extraDependencies } from '../../../../support/extraDependencies';
import suiteReducer from '../../../../reducers/suite/suiteReducer';

const _deviceReducer = prepareDeviceReducer(extraDependencies);

type State = {
    device: DeepPartial<ReturnType<typeof _deviceReducer>>;
    suite: DeepPartial<ReturnType<typeof suiteReducer>>;
};

describe('DeviceDisplay', () => {
    it('renders chunks without the "bitcoincash:" prefix', () => {
        const store = configureMockStore<State>({
            preloadedState: {
                device: {
                    selectedDevice: { features: { internal_model: DeviceModelInternal.T2T1 } },
                },
                suite: { settings: { theme: { variant: 'light' } } },
            },
        });

        const { baseElement } = renderWithProviders(
            store,
            <DeviceDisplay
                address="bitcoincash:qz5m3ha23lsscc2yr42s0r69y5ks8zw8jsea4weg2u"
                displayMode={DisplayMode.CHUNKS}
            />,
        );

        expect(baseElement.textContent).toBe('qz5m3ha23lsscc2yr42s0r69y5ks8zw8jsea4weg2u');
    });
});
