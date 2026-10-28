import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

import { selectReferralKeyDerivationDevice } from './selectReferralKeyDerivationDevice';

// A full TrezorDevice is irrelevant here, only the identity of wallet instances matters.
const createWallet = (overrides: Partial<TrezorDevice>) =>
    ({
        id: 'device-1',
        connected: true,
        instance: 1,
        useEmptyPassphrase: true,
        state: { staticSessionId: 'standard@device-1:1' },
        ...overrides,
    }) as unknown as TrezorDevice;

const createState = (devices: TrezorDevice[]): DeviceRootState => ({
    device: { ...deviceInitialState, devices },
});

const standardWallet = createWallet({});
const hiddenWallet = createWallet({
    instance: 2,
    useEmptyPassphrase: false,
    state: { staticSessionId: 'hidden@device-1:2' },
});

describe(selectReferralKeyDerivationDevice.name, () => {
    it('selects the standard wallet of the device', () => {
        expect(
            selectReferralKeyDerivationDevice(
                createState([hiddenWallet, standardWallet]),
                'device-1',
            ),
        ).toBe(standardWallet);
    });

    it('never selects a hidden wallet', () => {
        expect(
            selectReferralKeyDerivationDevice(createState([hiddenWallet]), 'device-1'),
        ).toBeNull();
    });

    it('ignores a standard wallet without state', () => {
        expect(
            selectReferralKeyDerivationDevice(
                createState([createWallet({ state: undefined })]),
                'device-1',
            ),
        ).toBeNull();
    });

    it('ignores standard wallets of other devices', () => {
        expect(
            selectReferralKeyDerivationDevice(
                createState([createWallet({ id: 'device-2' })]),
                'device-1',
            ),
        ).toBeNull();
    });
});
