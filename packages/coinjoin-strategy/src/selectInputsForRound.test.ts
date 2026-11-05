import { DeterministicRandom } from '@trezor/wabisabi-crypto/src/testing';

import selectInputsForRoundVectors from './__fixtures__/selectInputsForRound.json';
import { ScriptType } from './money';
import { type SelectInputsForRoundRequest, selectInputsForRound } from './selectInputsForRound';

/**
 * Parity against
 * `WalletWasabi.WabiSabiClientLibrary.Tests/IntegrationTests/TestVectors/SelectInputsForRound.json`
 * and `UnitTests/Controllers/Helpers/SelectInputsForRoundHelperTests.cs`.
 */
describe('selectInputsForRound — upstream test vectors', () => {
    selectInputsForRoundVectors.forEach((vector, index) => {
        it(`vector ${index} selects the expected indices`, () => {
            expect(
                selectInputsForRound(
                    vector.Request as SelectInputsForRoundRequest,
                    new DeterministicRandom(0),
                ),
            ).toEqual(vector.ExpectedResponse.Indices);
        });
    });
});

/** Port of `SelectInputsForRoundHelperTests.cs`. */
describe('selectInputsForRound — upstream unit tests', () => {
    const coins = (btc: number) => Math.round(btc * 100_000_000);

    const makeRequest = (
        Utxos: SelectInputsForRoundRequest['Utxos'],
    ): SelectInputsForRoundRequest => ({
        Utxos,
        AnonScoreTarget: 50,
        AllowedInputAmounts: { Min: coins(0.01), Max: coins(0.05) },
        AllowedOutputAmounts: { Min: coins(0.01), Max: coins(0.05) },
        AllowedInputTypes: [ScriptType.P2WPKH],
        CoordinationFeeRate: { Rate: 0, PlebsDontPayThreshold: 0 },
        // `new FeeRate(5m)` — five satoshis per virtual byte.
        MiningFeeRate: 5000,
        LiquidityClue: 0,
        SemiPrivateThreshold: 2,
    });

    it('selects nothing from no UTXOs', () => {
        expect(selectInputsForRound(makeRequest([]), new DeterministicRandom(0))).toEqual([]);
    });

    it('selects the one usable non-private UTXO from a mixed set', () => {
        const request = makeRequest([
            // Not an allowed script type.
            {
                Outpoint:
                    '06d0e3ae26dc6a98da5ea16d19eb6ad2817aab3f510d91c13de2ea945712425800000000',
                Amount: coins(0.02),
                ScriptPubKey: '76a914ce926a6e50d2f12dd1fe3bda4521df3a13bb4bcb88ac',
                AnonymitySet: 10,
            },
            // Anonymity set is higher than the target, so it might or might not be included.
            {
                Outpoint:
                    'f35481573468b5e4f4a4fce6afb2c3efb5e7f9b18ad5413e45ce07a1de315d7c00000000',
                Amount: coins(0.02),
                ScriptPubKey: '0014a16b5bb7788c6902f07c1049ca23d607116e7fb7',
                AnonymitySet: 60,
            },
            // 0.009 is below the minimum allowed value of 0.01.
            {
                Outpoint:
                    'dfb38af06d063128af9c4483bf944cc38c6608749cc145be2b9912ef7e18545000000000',
                Amount: coins(0.009),
                ScriptPubKey: '0014c868304afd51a19aa4352ec81b1765f9e73aedd1',
                AnonymitySet: 10,
            },
            // Ok.
            {
                Outpoint:
                    '6a8cb2d81062ef93ae5d58b5cbe78d5fc5159f609e0d06f767d2f8eae5ead90700000000',
                Amount: coins(0.015),
                ScriptPubKey: '00145e6ebd498b8c999ca5843baf7f04e9a43c935932',
                AnonymitySet: 10,
            },
        ]);

        const indices = selectInputsForRound(request, new DeterministicRandom(0));

        // The first possible result and the second possible result.
        expect([[3], [1, 3]]).toContainEqual(indices);
    });

    it('selects nothing when both UTXOs are already private', () => {
        const request = makeRequest([
            {
                Outpoint:
                    'dfb38af06d063128af9c4483bf944cc38c6608749cc145be2b9912ef7e18545000000000',
                Amount: coins(0.01),
                ScriptPubKey: '001491c6a44db2d01e66736b38205ed3003e572d41a3',
                AnonymitySet: 90,
            },
            {
                Outpoint:
                    'f35481573468b5e4f4a4fce6afb2c3efb5e7f9b18ad5413e45ce07a1de315d7c01000000',
                Amount: coins(0.01),
                ScriptPubKey: '001424574dca4f45fe4bac6e91383ca357c387f25732',
                AnonymitySet: 90,
            },
        ]);

        expect(selectInputsForRound(request, new DeterministicRandom(0))).toEqual([]);
    });

    it('honours DoNotSelectPrivateCoins', () => {
        const request = {
            ...makeRequest([
                {
                    Outpoint:
                        '6a8cb2d81062ef93ae5d58b5cbe78d5fc5159f609e0d06f767d2f8eae5ead90700000000',
                    Amount: coins(0.015),
                    ScriptPubKey: '00145e6ebd498b8c999ca5843baf7f04e9a43c935932',
                    AnonymitySet: 90,
                },
            ]),
            DoNotSelectPrivateCoins: true,
        };

        expect(selectInputsForRound(request, new DeterministicRandom(0))).toEqual([]);
    });

    it('accepts the coordinator script type names as well as the enum values', () => {
        const utxo = {
            Outpoint: '6a8cb2d81062ef93ae5d58b5cbe78d5fc5159f609e0d06f767d2f8eae5ead90700000000',
            Amount: coins(0.015),
            ScriptPubKey: '00145e6ebd498b8c999ca5843baf7f04e9a43c935932',
            AnonymitySet: 10,
        };

        expect(
            selectInputsForRound(
                { ...makeRequest([utxo]), AllowedInputTypes: ['P2WPKH', 'Taproot'] },
                new DeterministicRandom(0),
            ),
        ).toEqual(
            selectInputsForRound(
                { ...makeRequest([utxo]), AllowedInputTypes: [4, 7] },
                new DeterministicRandom(0),
            ),
        );
    });
});
