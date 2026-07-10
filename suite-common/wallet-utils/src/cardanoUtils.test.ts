import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO, PROTO } from '@trezor/connect';
import { CARDANO_DERIVATIONS } from '@trezor/connect-common';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { asAmountSubunit } from './AmountTypes';
import * as fixtures from './__fixtures__/cardanoUtils';
import { getUnusedChangeAddress } from './accountUtils';
import {
    formatMaxOutputAmount,
    getAddressParameters,
    getAddressType,
    getCardanoTokenSendMinAdaAmount,
    getDelegationCertificates,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getShortFingerprint,
    getStakingPath,
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
        expect(getProtocolMagic(asNetworkSymbol('ada'))).toEqual(CARDANO.PROTOCOL_MAGICS.mainnet);

        expect(getNetworkId()).toEqual(CARDANO.NETWORK_IDS.mainnet);

        expect(getAddressType()).toEqual(PROTO.CardanoAddressType.BASE);
        expect(getAddressType()).toEqual(PROTO.CardanoAddressType.BASE);

        // @ts-expect-error
        expect(getStakingPath({ index: 1, symbol: 'ada' })).toEqual(`m/1852'/1815'/1'/2/0`);

        // @ts-expect-error
        expect(getStakingPath({ index: 12, symbol: 'ada' })).toEqual(`m/1852'/1815'/12'/2/0`);
        expect(getShortFingerprint('asset1dffrfk79uxwq2a8yaslcfedycgga55tuv5dezd')).toEqual(
            'asset1dffr…55tuv5dezd',
        );

        // @ts-expect-error params are partial
        expect(isCardanoTx({ networkType: 'cardano' }, {})).toBe(true);
        // @ts-expect-error params are partial
        expect(isCardanoTx({ networkType: 'bitcoin' }, {})).toBe(false);
    });

    describe('getDerivationType', () => {
        // prepareNewAccountPayload passes this value on the derive path, so it has to be the very
        // same one discovery uses, otherwise a fresh account gets a different key than the
        // discovered ones. getDerivationType keeps its own copy of the mapping, so pin it to
        // connect's CARDANO_DERIVATIONS to catch a drift between the two.
        it.each(typedObjectKeys(CARDANO_DERIVATIONS))(
            'matches the derivation discovery uses for %s',
            accountType => {
                expect(getDerivationType(accountType)).toBe(CARDANO_DERIVATIONS[accountType]);
            },
        );

        it('falls back to ICARUS for an unknown account type', () => {
            // TS does not allow this, but in runtime, the default case handles it
            expect(getDerivationType(undefined as any)).toBe(CARDANO_DERIVATIONS.normal);
        });
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
