import { combineReducers } from '@reduxjs/toolkit';

import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { validatePath } from '@trezor/connect-common';

import {
    type GetPaymentRequestOutputsThunkState,
    getPaymentRequestOutputsThunk,
} from './getPaymentRequestOutputs';
import { accounts } from '../../reducers/__fixtures__/account';
import { formatSlip24SendAmountByNetwork } from '../../utils/signature/signatureUtils';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    getAddress: jest.fn(),
}));

const [account] = accounts;
if (!account) {
    throw new Error('Missing test fixture');
}
const network = getNetwork(account.symbol);

const selectedDevice = {
    path: 'device-path',
    instance: 1,
    state: { staticSessionId: account.deviceState },
    useEmptyPassphrase: true,
} as unknown as TrezorDevice;

const paymentAddress = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const changePath = "m/84'/0'/0'/1/0";
const changeAddress = 'bc1qktmhrsmsenepnnfst8x6j27l0uqv7ggrg8x38q';

const composedLevels = {
    type: 'final',
    totalSpent: '100000',
    fee: '1000',
    feePerByte: '10',
    bytes: 250,
    outputs: [
        { address: paymentAddress, amount: '50000', script_type: 'PAYTOADDRESS' },
        { address_n: validatePath(changePath), amount: '49000', script_type: 'PAYTOWITNESS' },
    ],
} as unknown as GeneralPrecomposedTransactionFinal;

const createMockStore = ({ hasSelectedDevice = true } = {}) =>
    createTestCompositionRoot<void, GetPaymentRequestOutputsThunkState>({
        reducer: combineReducers({
            device: (): DeviceReducerState => ({
                ...deviceInitialState,
                selectedDevice: hasSelectedDevice ? selectedDevice : undefined,
            }),
        }),
    }).services.store;

describe('getPaymentRequestOutputsThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resolves the change address on the selected device session', async () => {
        (TrezorConnect.getAddress as jest.Mock).mockResolvedValue({
            success: true,
            payload: { address: changeAddress },
        });

        const result = await createMockStore().dispatch(
            getPaymentRequestOutputsThunk({ account, network, composedLevels }),
        );

        expect(TrezorConnect.getAddress).toHaveBeenCalledTimes(1);
        expect(TrezorConnect.getAddress).toHaveBeenCalledWith(
            expect.objectContaining({
                device: expect.objectContaining({
                    path: 'device-path',
                    instance: 1,
                    state: { staticSessionId: account.deviceState },
                    useEmptyPassphrase: true,
                }),
                path: validatePath(changePath),
                coin: account.symbol,
                showOnTrezor: false,
                keepSession: true,
            }),
        );
        expect(result.type).toBe(getPaymentRequestOutputsThunk.fulfilled.type);
        expect(result.payload).toEqual([
            {
                address: paymentAddress,
                amount: formatSlip24SendAmountByNetwork({ value: '50000', network }),
            },
            {
                address: changeAddress,
                amount: formatSlip24SendAmountByNetwork({ value: '49000', network }),
            },
        ]);
    });

    it('rejects without a device call when no device is selected', async () => {
        const result = await createMockStore({ hasSelectedDevice: false }).dispatch(
            getPaymentRequestOutputsThunk({ account, network, composedLevels }),
        );

        expect(TrezorConnect.getAddress).not.toHaveBeenCalled();
        expect(result.type).toBe(getPaymentRequestOutputsThunk.rejected.type);
        expect(result.payload).toEqual({
            type: 'sign-tx-error',
            error: { id: 'TR_DEVICE_NOT_CONNECTED' },
        });
    });

    it('rejects when the change address cannot be resolved', async () => {
        (TrezorConnect.getAddress as jest.Mock).mockResolvedValue({
            success: false,
            payload: { error: 'Device disconnected' },
        });

        const result = await createMockStore().dispatch(
            getPaymentRequestOutputsThunk({ account, network, composedLevels }),
        );

        expect(result.type).toBe(getPaymentRequestOutputsThunk.rejected.type);
        expect(result.payload).toEqual({
            type: 'sign-tx-error',
            error: { id: 'TR_PAYMENT_REQUESTS_ERROR' },
        });
    });
});
