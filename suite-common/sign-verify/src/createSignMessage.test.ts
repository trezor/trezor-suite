import { events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/networks';
import { mockNetworkModule, mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { mock } from '@trezor/dependency-injection';
import {
    type NetworkSignVerify,
    type SignatureFormat,
    toSignVerifyDeviceError,
} from '@trezor/network-module-suite-common-types';

import { type SignMessageDeps, createSignMessage } from './createSignMessage';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const LEGACY_ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    accountType: 'legacy',
});
const ETHEREUM_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const CONNECTED_DEVICE = mockSuiteDevice({
    connected: true,
    available: true,
}) as TrezorDeviceWithState;

describe('signVerify.sign', () => {
    let dispatch: jest.Mock;
    let signMessage: jest.MockedFunction<NetworkSignVerify<NetworkSymbol>['signMessage']>;
    let deps: SignMessageDeps & { analytics: ReturnType<typeof mockAnalytics> };

    beforeEach(() => {
        dispatch = jest.fn();
        signMessage = mock<NetworkSignVerify<NetworkSymbol>['signMessage']>();
        deps = {
            analytics: mockAnalytics(),
            networkModuleRepository: mockNetworkModuleRepository({
                get: () =>
                    mockNetworkModule({
                        signVerify: {
                            getFormats: (symbol, accountType) =>
                                symbol === 'btc' && accountType !== 'legacy'
                                    ? ['trezor', 'electrum']
                                    : [],
                            getDefaultFormat: () => 'trezor',
                            signMessage,
                        },
                    }),
                isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
            }),
            dispatch,
        };
    });

    const setSignResponse = (response: any) => signMessage.mockResolvedValue(response);

    const sign = (
        account: Account,
        path: string,
        message: string,
        hex = false,
        format?: SignatureFormat,
    ) =>
        createSignMessage(deps).sign({
            device: CONNECTED_DEVICE,
            account,
            path,
            message,
            hex,
            format,
        });

    it('sign', async () => {
        setSignResponse({
            success: true,
            payload: {
                address: ADDRESS,
                signature: SIGNATURE,
            },
        });
        const res = await sign(ACCOUNT, PATH, MESSAGE);
        expect(res).toStrictEqual({
            success: true,
            payload: { address: ADDRESS, signature: SIGNATURE },
        });
    });

    describe('hex format', () => {
        it('reports which reading was used', async () => {
            setSignResponse({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign(ACCOUNT, PATH, MESSAGE, true);

            expect(deps.analytics.report).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ hex: true }) }),
            );
        });
    });

    describe('analytics', () => {
        it('reports a successful sign with the input format and the signature format', async () => {
            setSignResponse({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign(ACCOUNT, PATH, MESSAGE, true, 'electrum');

            expect(deps.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.analytics.report).toHaveBeenCalledWith({
                type: events.coinSignMessageEvent.name,
                payload: {
                    status: 'success',
                    symbol: 'btc',
                    hex: true,
                    signatureFormat: 'electrum',
                },
            });
        });

        it.each([
            ['an account signing in a single format', ETHEREUM_ACCOUNT],
            ['an account not offered the choice', LEGACY_ACCOUNT],
        ])('leaves the signature format out for %s', async (_name, account) => {
            setSignResponse({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign(account, PATH, MESSAGE);

            expect(deps.analytics.report).toHaveBeenCalledWith({
                type: events.coinSignMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex: false },
            });
        });

        it('reports a failed sign with the error code', async () => {
            setSignResponse({
                success: false,
                error: toSignVerifyDeviceError({
                    message: 'Signing failed',
                    code: 'Failure_DataError',
                }),
            });

            await sign(ACCOUNT, PATH, MESSAGE);

            expect(deps.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.analytics.report).toHaveBeenCalledWith({
                type: events.coinSignMessageEvent.name,
                payload: {
                    status: 'error',
                    error: 'Failure_DataError',
                    symbol: 'btc',
                    hex: false,
                    signatureFormat: 'trezor',
                },
            });
        });

        it.each(['Method_Cancel', 'Failure_ActionCancelled'])(
            'reports a sign rejected with %s as cancelled',
            async code => {
                setSignResponse({
                    success: false,
                    error: toSignVerifyDeviceError({ message: 'Cancelled', code }),
                });

                await sign(ACCOUNT, PATH, MESSAGE);

                expect(deps.analytics.report).toHaveBeenCalledTimes(1);
                expect(deps.analytics.report).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: events.coinSignMessageEvent.name,
                        payload: expect.objectContaining({
                            status: 'cancelled',
                            error: 'DeviceCancelled',
                        }),
                    }),
                );
            },
        );

        it('never reports the message, the address or the signature', async () => {
            setSignResponse({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign(ACCOUNT, PATH, MESSAGE);

            const reported = JSON.stringify(deps.analytics.report.mock.calls);

            expect(reported).not.toContain(MESSAGE);
            expect(reported).not.toContain(ADDRESS);
            expect(reported).not.toContain(SIGNATURE);
            expect(reported).not.toContain(PATH);
        });
    });
});
