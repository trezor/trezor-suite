import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getAddressParameters } from '@trezor/network-cardano-suite-common';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit } from './AmountTypes';
import * as fixtures from './__fixtures__/cardanoUtils';
import { getUnusedChangeAddress } from './accountUtils';
import {
    formatMaxOutputAmount,
    getCardanoTokenSendMinAdaAmount,
    getDelegationCertificates,
    getShortFingerprint,
    getVotingCertificates,
    isCardanoTokenSendAdaInsufficient,
    isCardanoTx,
    transformUserOutputs,
} from './cardanoUtils';

describe('cardano utils', () => {
    let dateSpy: any;
    beforeAll(() => {
        dateSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1653394389512);
    });

    afterAll(() => {
        dateSpy.mockRestore();
    });

    it('basic test', () => {
        expect(getShortFingerprint('asset1dffrfk79uxwq2a8yaslcfedycgga55tuv5dezd')).toEqual(
            'asset1dffr…55tuv5dezd',
        );

        // @ts-expect-error params are partial
        expect(isCardanoTx({ networkType: 'cardano' }, {})).toBe(true);
        // @ts-expect-error params are partial
        expect(isCardanoTx({ networkType: 'bitcoin' }, {})).toBe(false);
    });

    fixtures.getChangeAddressParameters.forEach(f => {
        it(`getChangeAddressParameters: ${f.description}`, () => {
            const address = getUnusedChangeAddress(f.account.addresses.change);
            const res = address && {
                address: address.address,
                addressParameters: getAddressParameters(f.account, address.path),
            };
            expect(res).toMatchObject(f.result);
        });
    });

    fixtures.transformUserOutputs.forEach(f => {
        it(`transformUserOutputs: ${f.description}`, () => {
            expect(
                transformUserOutputs(
                    // @ts-expect-error params are partial
                    f.outputs,
                    f.accountTokens,
                    f.symbol,
                    f.maxOutputIndex,
                ),
            ).toMatchObject(f.result);
        });
    });

    fixtures.formatMaxOutputAmount.forEach(f => {
        it(`transformUserOutputs: ${f.description}`, () => {
            expect(
                // @ts-expect-error params are partial
                formatMaxOutputAmount(f.maxAmount, f.maxOutput, f.account),
            ).toBe(f.result);
        });
    });

    fixtures.getDelegationCertificates.forEach(f => {
        it(`getDelegationCertificates: ${f.description}`, () => {
            expect(
                getDelegationCertificates(f.stakingPath, f.poolHex, f.shouldRegister),
            ).toMatchObject(f.result);
        });
    });
    fixtures.getVotingCertificates.forEach(f => {
        it(`getVotingCertificates: ${f.description}`, () => {
            expect(getVotingCertificates(f.stakingPath, f.dRep)).toMatchObject(f.result);
        });
    });

    describe('getCardanoTokenSendMinAdaAmount', () => {
        const symbol = asNetworkSymbol('ada');
        const tokenOutput = { token: 'policyIdAssetName', amount: '10' };

        it('returns totalSpent of the composed transaction', () => {
            expect(
                getCardanoTokenSendMinAdaAmount({
                    symbol,
                    outputs: [tokenOutput],
                    composedFeeLevel: {
                        type: 'nonfinal',
                        fee: '170000',
                        feePerByte: '44',
                        bytes: 0,
                        totalSpent: '1340000',
                        max: undefined,
                    },
                }).toFixed(),
            ).toBe('1340000');
        });

        it('estimates 1 ADA per output plus ADA amounts when not composed', () => {
            expect(
                getCardanoTokenSendMinAdaAmount({
                    symbol,
                    outputs: [tokenOutput, { token: null, amount: '2.5' }],
                }).toFixed(),
            ).toBe('4500000');
        });

        it('estimates when compose failed', () => {
            expect(
                getCardanoTokenSendMinAdaAmount({
                    symbol,
                    outputs: [tokenOutput],
                    composedFeeLevel: { type: 'error', error: 'UTXO_BALANCE_INSUFFICIENT' },
                }).toFixed(),
            ).toBe('1000000');
        });
    });

    describe('isCardanoTokenSendAdaInsufficient', () => {
        const minAdaAmount = asAmountSubunit(new BigNumber(1340000));

        it('returns false when the balance covers the minimum ADA', () => {
            expect(isCardanoTokenSendAdaInsufficient({ balance: '1340000', minAdaAmount })).toBe(
                false,
            );
        });

        it('returns true when the balance is below the minimum ADA', () => {
            expect(isCardanoTokenSendAdaInsufficient({ balance: '1339999', minAdaAmount })).toBe(
                true,
            );
        });
    });
});
