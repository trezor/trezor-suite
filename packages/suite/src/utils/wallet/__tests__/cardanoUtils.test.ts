import * as cardanoUtils from '../../../../../../suite-common/wallet-utils/src/cardanoUtils';
import { CARDANO, PROTO } from '@trezor/connect';
import * as fixtures from '../__fixtures__/cardanoUtils';

describe('cardano utils', () => {
    let dateSpy: any;
    beforeAll(() => {
        dateSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1653394389512);
    });

    afterAll(() => {
        dateSpy.mockRestore();
    });

    expect(cardanoUtils.getProtocolMagic('ada')).toEqual(CARDANO.PROTOCOL_MAGICS.mainnet);
    expect(cardanoUtils.getProtocolMagic('tada')).toEqual(1097911063);

    expect(cardanoUtils.getDerivationType('normal')).toEqual(1);
    expect(cardanoUtils.getDerivationType('legacy')).toEqual(2);
    expect(cardanoUtils.getDerivationType('ledger')).toEqual(0);
    expect(cardanoUtils.getDerivationType(undefined)).toEqual(1);

    expect(cardanoUtils.getNetworkId('ada')).toEqual(CARDANO.NETWORK_IDS.mainnet);
    expect(cardanoUtils.getNetworkId('tada')).toEqual(CARDANO.NETWORK_IDS.testnet);

    expect(cardanoUtils.getAddressType('normal')).toEqual(PROTO.CardanoAddressType.BASE);
    expect(cardanoUtils.getAddressType('legacy')).toEqual(PROTO.CardanoAddressType.BASE);

    // @ts-ignore
    expect(cardanoUtils.getStakingPath({ index: 1, symbol: 'ada' })).toEqual(
        `m/1852'/1815'/1'/2/0`,
    );

    // @ts-ignore
    expect(cardanoUtils.getStakingPath({ index: 12, symbol: 'ada' })).toEqual(
        `m/1852'/1815'/12'/2/0`,
    );
    expect(
        cardanoUtils.getShortFingerprint('asset1dffrfk79uxwq2a8yaslcfedycgga55tuv5dezd'),
    ).toEqual('asset1dffr…55tuv5dezd');

    // @ts-ignore params are partial
    expect(cardanoUtils.isCardanoTx({ networkType: 'cardano' }, {})).toBe(true);
    // @ts-ignore params are partial
    expect(cardanoUtils.isCardanoTx({ networkType: 'bitcoin' }, {})).toBe(false);
    // @ts-ignore params are partial
    expect(cardanoUtils.isCardanoExternalOutput({ address: 'addr1' }, {})).toBe(true);
    // @ts-ignore params are partial
    expect(cardanoUtils.isCardanoExternalOutput({ addressParameters: {} }, {})).toBe(false);

    it('composeTxPlan', async () => {
        expect(
            await cardanoUtils.composeTxPlan(
                'descriptor',
                [],
                [
                    {
                        type: 0,
                    },
                    {
                        path: 'path',
                        pool: 'abc',
                        type: 2,
                    },
                ],
                [{ amount: '10', path: 'path', stakeAddress: 'stkAddr' }],
                {
                    address: 'addr',
                    addressParameters: {
                        path: 'path',
                        addressType: 0,
                        stakingPath: 'stkpath',
                    },
                },
            ),
        ).toMatchObject({
            txPlan: undefined,
            certificates: [
                {
                    type: 0,
                },
                {
                    path: 'path',
                    pool: 'abc',
                    type: 2,
                },
            ],
            withdrawals: [{ amount: '10', path: 'path', stakeAddress: 'stkAddr' }],
        });
    });

    fixtures.getChangeAddressParameters.forEach(f => {
        it(`getChangeAddressParameters: ${f.description}`, () => {
            // @ts-ignore params are partial
            expect(cardanoUtils.getChangeAddressParameters(f.account)).toMatchObject(f.result);
        });
    });

    fixtures.transformUserOutputs.forEach(f => {
        it(`transformUserOutputs: ${f.description}`, () => {
            expect(
                cardanoUtils.transformUserOutputs(
                    // @ts-ignore params are partial
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
                // @ts-ignore params are partial
                cardanoUtils.formatMaxOutputAmount(f.maxAmount, f.maxOutput, f.account),
            ).toBe(f.result);
        });
    });

    fixtures.transformUtxos.forEach(f => {
        it(`transformUtxos: ${f.description}`, () => {
            expect(cardanoUtils.transformUtxos(f.utxo)).toMatchObject(f.result);
        });
    });

    fixtures.prepareCertificates.forEach(f => {
        it(`prepareCertificates: ${f.description}`, () => {
            expect(cardanoUtils.prepareCertificates(f.certificates)).toMatchObject(f.result);
        });
    });

    fixtures.parseAsset.forEach(f => {
        it(`parseAsset: ${f.description}`, () => {
            expect(cardanoUtils.parseAsset(f.hex)).toMatchObject(f.result);
        });
    });

    fixtures.isPoolOverSaturated.forEach(f => {
        it(`isPoolOverSaturated: ${f.description}`, () => {
            // @ts-ignore params are partial
            expect(cardanoUtils.isPoolOverSaturated(f.pool, f.additionalStake)).toBe(f.result);
        });
    });

    fixtures.getStakePoolForDelegation.forEach(f => {
        it(`getStakePoolForDelegation: ${f.description}`, () => {
            expect(
                cardanoUtils.getStakePoolForDelegation(f.trezorPools, f.accountBalance),
            ).toMatchObject(f.result);
        });
    });
    fixtures.getDelegationCertificates.forEach(f => {
        it(`getDelegationCertificates: ${f.description}`, () => {
            expect(
                cardanoUtils.getDelegationCertificates(f.stakingPath, f.poolHex, f.shouldRegister),
            ).toMatchObject(f.result);
        });
    });

    it(`getTTL`, () => {
        expect(cardanoUtils.getTtl(true)).toBe(59032373);
    });
});
