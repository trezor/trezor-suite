import { type NetworkSymbol } from '@suite-common/networks';
import { mockNetworkModule, mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import {
    type NetworkSignVerify,
    type SignatureFormat,
    connectErrorToSignVerifyError,
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
    state: { staticSessionId: '1@2:3' },
});

describe('signVerify.sign', () => {
    let signMessage: jest.MockedFunction<NetworkSignVerify<NetworkSymbol>['signMessage']>;
    let reportSign: jest.Mock;
    let deps: SignMessageDeps;

    beforeEach(() => {
        signMessage = mock<NetworkSignVerify<NetworkSymbol>['signMessage']>();
        reportSign = jest.fn();
        deps = {
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
            signVerifyReporter: { reportSign, reportVerify: jest.fn() },
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

    describe('reporting', () => {
        it('reports the input format and the signature format', async () => {
            setSignResponse({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            const result = await sign(ACCOUNT, PATH, MESSAGE, true, 'electrum');

            expect(reportSign).toHaveBeenCalledTimes(1);
            expect(reportSign).toHaveBeenCalledWith(
                { symbol: 'btc', hex: true, signatureFormat: 'electrum' },
                result,
            );
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

            expect(reportSign).toHaveBeenCalledWith(
                { symbol: account.symbol, hex: false, signatureFormat: undefined },
                expect.anything(),
            );
        });

        it('reports a failed sign with the default signature format', async () => {
            setSignResponse({
                success: false,
                error: connectErrorToSignVerifyError({
                    message: 'Signing failed',
                    code: 'Failure_DataError',
                }),
            });

            const result = await sign(ACCOUNT, PATH, MESSAGE);

            expect(reportSign).toHaveBeenCalledTimes(1);
            expect(reportSign).toHaveBeenCalledWith(
                { symbol: 'btc', hex: false, signatureFormat: 'trezor' },
                result,
            );
        });

        it('never reports the message or the path', async () => {
            setSignResponse({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign(ACCOUNT, PATH, MESSAGE);

            const reported = JSON.stringify(reportSign.mock.calls);

            expect(reported).not.toContain(MESSAGE);
            expect(reported).not.toContain(PATH);
        });
    });
});
