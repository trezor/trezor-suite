import { events } from '@suite-common/analytics';
import { deviceInitialState } from '@suite-common/device';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { asGetter, mock } from '@trezor/dependency-injection';
import {
    type ClosedSignMessageParams,
    type MessageSigning,
    type MessageSigningDefinition,
    type MessageSigningError,
    type OpenNetwork,
    defineMessageSigning,
} from '@trezor/network-module-suite-common-types';
import { mockSuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types/mocks';
import { err, ok } from '@trezor/type-utils';

import {
    type SignVerifyRootState,
    type SignVerifyThunkExtra,
    showAddressThunk,
    signThunk,
    verifyThunk,
} from './signVerifyActions';

const PATH = "m/84'/0'/0'/0/0";
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const CANCELLED: MessageSigningError = { code: 'Method_Cancel', message: 'Cancelled' };
const FAILED: MessageSigningError = { code: 'Failure_UnknownCode', message: 'Unknown error' };

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const LEGACY_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc'), accountType: 'legacy' });
const CONNECTED_DEVICE = mockSuiteDevice({ connected: true, available: true });

type TestAccount = { readonly hasChoice: boolean };
type TestFormat = 'default' | 'electrum';

const LABEL = { id: 'TR_TEST', defaultMessage: 'Test' };

const createMessageSigning = (
    overrides: Partial<MessageSigningDefinition<TestAccount, TestFormat>>,
) =>
    defineMessageSigning<TestAccount, TestFormat>({
        labels: { title: LABEL },
        addressSelection: 'pick',
        outputs: ['signature'],
        toAccount: account => ({ hasChoice: account.accountType !== 'legacy' }),
        formats: {
            kind: 'signature',
            label: LABEL,
            options: { default: LABEL, electrum: LABEL },
            getAvailable: account => (account.hasChoice ? ['default', 'electrum'] : []),
        },
        getSignAddressGroups: () => [],
        sign: () => Promise.resolve(ok({ signature: SIGNATURE, address: ADDRESS })),
        ...overrides,
    });

const createNetwork = (messageSigning: MessageSigning | undefined): OpenNetwork => ({
    family: 'test',
    symbol: asNetworkSymbol('btc'),
    context: { symbol: asNetworkSymbol('btc'), backend: 'blockbook' },
    config: mockSuiteCommonNetworkConfig(),
    capabilities: { messageSigning },
});

const createExtra = (messageSigning: MessageSigning | undefined) => {
    const extra: SignVerifyThunkExtra = {
        services: {
            analytics: mockAnalytics(),
            networks: mockNetworksServices({
                getNetwork: asGetter(() => createNetwork(messageSigning)),
            }),
        },
    };

    return extra;
};

const createState = (selectedDevice: TrezorDevice | undefined): SignVerifyRootState => ({
    device: { ...deviceInitialState, selectedDevice },
    wallet: { settings: initialWalletSettingsState },
});

const getConnectedState = () => createState(CONNECTED_DEVICE);

const getElectrumFormat = (messageSigning: MessageSigning, account: Account) =>
    messageSigning.getFormatChoice(account)?.options.find(({ format }) => format === 'electrum')
        ?.format;

describe('sign/verify thunks', () => {
    let dispatch: jest.Mock;

    beforeEach(() => {
        dispatch = jest.fn();
    });

    const dispatchedToastTypes = () =>
        dispatch.mock.calls
            .map(([action]) => action?.payload?.type)
            .filter((type): type is string => typeof type === 'string');

    it('signs through the capability of the account network with the selected device', async () => {
        const sign = mock<
            (
                params: ClosedSignMessageParams<TestAccount, TestFormat>,
            ) => ReturnType<MessageSigning['sign']>
        >(() => Promise.resolve(ok({ signature: SIGNATURE, address: ADDRESS })));
        const messageSigning = createMessageSigning({ sign });
        const extra = createExtra(messageSigning);

        const result = await signThunk({
            account: ACCOUNT,
            path: PATH,
            message: MESSAGE,
            isHex: true,
            format: getElectrumFormat(messageSigning, ACCOUNT),
        })(dispatch, getConnectedState, extra);

        expect(result).toEqual({ signature: SIGNATURE, address: ADDRESS });
        expect(sign).toHaveBeenCalledWith(
            expect.objectContaining({
                device: CONNECTED_DEVICE,
                path: PATH,
                message: MESSAGE,
                isHex: true,
                format: 'electrum',
            }),
        );
        expect(dispatchedToastTypes()).toEqual(['sign-message-success']);
        expect(extra.services.analytics.report).toHaveBeenCalledWith({
            type: events.coinSignMessageEvent.name,
            payload: { status: 'success', symbol: 'btc', hex: true, signatureFormat: 'electrum' },
        });
    });

    it('reports no signature format for an account that had no choice', async () => {
        const extra = createExtra(createMessageSigning({}));

        await signThunk({ account: LEGACY_ACCOUNT, path: PATH, message: MESSAGE, isHex: false })(
            dispatch,
            getConnectedState,
            extra,
        );

        expect(extra.services.analytics.report).toHaveBeenCalledWith({
            type: events.coinSignMessageEvent.name,
            payload: { status: 'success', symbol: 'btc', hex: false },
        });
    });

    it('reports a cancelled sign and shows the error', async () => {
        const extra = createExtra(
            createMessageSigning({ sign: () => Promise.resolve(err(CANCELLED)) }),
        );

        const result = await signThunk({
            account: ACCOUNT,
            path: PATH,
            message: MESSAGE,
            isHex: false,
        })(dispatch, getConnectedState, extra);

        expect(result).toBe(false);
        expect(dispatchedToastTypes()).toEqual(['sign-message-error']);
        expect(extra.services.analytics.report).toHaveBeenCalledWith({
            type: events.coinSignMessageEvent.name,
            payload: {
                status: 'cancelled',
                error: 'Method_Cancel',
                symbol: 'btc',
                hex: false,
                signatureFormat: 'trezor',
            },
        });
    });

    it('does not reach the network without a connected device', async () => {
        const sign = mock<MessageSigning['sign']>();
        const extra = createExtra({ ...createMessageSigning({}), sign });

        const result = await signThunk({
            account: ACCOUNT,
            path: PATH,
            message: MESSAGE,
            isHex: false,
        })(dispatch, () => createState(undefined), extra);

        expect(result).toBe(false);
        expect(sign).not.toHaveBeenCalled();
        expect(dispatchedToastTypes()).toEqual(['sign-message-error']);
    });

    it('refuses an account whose network does not sign messages', async () => {
        const extra = createExtra(undefined);

        const result = await signThunk({
            account: ACCOUNT,
            path: PATH,
            message: MESSAGE,
            isHex: false,
        })(dispatch, getConnectedState, extra);

        expect(result).toBe(false);
        expect(dispatchedToastTypes()).toEqual(['sign-message-error']);
    });

    it('verifies through the capability', async () => {
        const extra = createExtra(createMessageSigning({ verify: () => Promise.resolve(ok()) }));

        const result = await verifyThunk({
            account: ACCOUNT,
            address: ADDRESS,
            message: MESSAGE,
            signature: SIGNATURE,
            isHex: false,
        })(dispatch, getConnectedState, extra);

        expect(result).toBe('verified');
        expect(dispatchedToastTypes()).toEqual(['verify-message-success']);
    });

    it('tells a verification cancelled on the device apart from a failed one', async () => {
        const verifyWith = (error: MessageSigningError) =>
            verifyThunk({
                account: ACCOUNT,
                address: ADDRESS,
                message: MESSAGE,
                signature: SIGNATURE,
                isHex: false,
            })(
                dispatch,
                getConnectedState,
                createExtra(createMessageSigning({ verify: () => Promise.resolve(err(error)) })),
            );

        await expect(verifyWith(CANCELLED)).resolves.toBe('cancelled');
        await expect(verifyWith(FAILED)).resolves.toBe('failed');
        expect(dispatchedToastTypes()).toEqual([
            'verify-message-cancelled',
            'verify-message-error',
        ]);
    });

    it('fails verification on a network that cannot verify', async () => {
        const result = await verifyThunk({
            account: ACCOUNT,
            address: ADDRESS,
            message: MESSAGE,
            signature: SIGNATURE,
            isHex: false,
        })(dispatch, getConnectedState, createExtra(createMessageSigning({})));

        expect(result).toBe('failed');
    });

    it('shows the address on the device', async () => {
        const extra = createExtra(
            createMessageSigning({
                showAddress: ({ address, path }) => Promise.resolve(ok({ address, path })),
            }),
        );

        const result = await showAddressThunk({ account: ACCOUNT, address: ADDRESS, path: PATH })(
            dispatch,
            getConnectedState,
            extra,
        );

        expect(result).toEqual({ address: ADDRESS, path: PATH });
    });
});
