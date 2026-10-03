import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type SignVerifyRootState, getSignVerifyStateParams } from './signVerifyDevice';

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

const createState = (
    selectedDevice: TrezorDevice | undefined,
    addressDisplayType: AddressDisplayOptions = AddressDisplayOptions.ORIGINAL,
): SignVerifyRootState => ({
    device: { ...deviceInitialState, selectedDevice },
    wallet: { settings: { ...initialWalletSettingsState, addressDisplayType } },
});

describe('getSignVerifyStateParams', () => {
    it('hands over the selected device and the account coin', async () => {
        const device = mockSuiteDevice({ connected: true, available: true });

        const params = await getSignVerifyStateParams(ACCOUNT, () => createState(device));

        expect(params).toStrictEqual({
            device,
            account: ACCOUNT,
            coin: ACCOUNT.symbol,
            chunkify: false,
        });
    });

    it('asks for a chunked address when that is how addresses are displayed', async () => {
        const device = mockSuiteDevice({ connected: true, available: true });

        const params = await getSignVerifyStateParams(ACCOUNT, () =>
            createState(device, AddressDisplayOptions.CHUNKED),
        );

        expect(params.chunkify).toBe(true);
    });

    it.each([
        ['there is no selected device', undefined],
        ['the device is disconnected', mockSuiteDevice({ connected: false, available: true })],
        ['the device is unavailable', mockSuiteDevice({ connected: true, available: false })],
    ])('refuses to go to the device when %s', async (_name, device) => {
        await expect(getSignVerifyStateParams(ACCOUNT, () => createState(device))).rejects.toThrow(
            'Device not found',
        );
    });
});
