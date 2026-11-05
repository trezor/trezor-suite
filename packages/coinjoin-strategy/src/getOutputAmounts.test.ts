import { DeterministicRandom } from '@trezor/wabisabi-crypto/src/testing';

import getOutputsAmounts from './__fixtures__/getOutputsAmounts.json';
import { getOutputAmounts } from './getOutputAmounts';

/**
 * Parity against
 * `WalletWasabi.WabiSabiClientLibrary.Tests/IntegrationTests/TestVectors/GetOutputsAmounts.json`
 * and `UnitTests/Controllers/Helpers/GetOutputHelperTests.cs`, both under
 * `DeterministicRandom(0)`.
 */
describe('getOutputAmounts — upstream test vectors', () => {
    getOutputsAmounts.forEach((vector, index) => {
        const name = vector.Name === '' ? `vector ${index}` : vector.Name;

        if (vector.ExpectedStatusCode === 200) {
            it(`${name} produces the expected amounts`, () => {
                expect(getOutputAmounts(vector.Request, new DeterministicRandom(0))).toEqual(
                    (vector.ExpectedResponse as { OutputAmounts: number[] }).OutputAmounts,
                );
            });
        } else {
            it(`${name} fails with the expected message`, () => {
                expect(() => getOutputAmounts(vector.Request, new DeterministicRandom(0))).toThrow(
                    (vector.ExpectedResponse as { Description: string }).Description,
                );
            });
        }
    });

    // Port of `SimpleGetOutputAmountsTest` in GetOutputHelperTests.cs
    it('decomposes a single small input', () => {
        const amounts = getOutputAmounts(
            {
                InternalAmounts: [1000],
                ExternalAmounts: [2000],
                OutputSize: 43,
                InputSize: 58,
                AvailableVsize: 10_000,
                MiningFeeRate: 100,
                AllowedOutputAmounts: { Min: 10, Max: 10_000 },
            },
            new DeterministicRandom(0),
        );

        expect(amounts).toEqual([729, 263]);
    });

    it('rejects anything but taproot sizes', () => {
        const request = {
            InternalAmounts: [1000],
            ExternalAmounts: [2000],
            OutputSize: 43,
            InputSize: 58,
            AvailableVsize: 10_000,
            MiningFeeRate: 100,
            AllowedOutputAmounts: { Min: 10, Max: 10_000 },
        };

        expect(() =>
            getOutputAmounts({ ...request, InputSize: 69 }, new DeterministicRandom(0)),
        ).toThrow('Incorrect input size. Only taproot is supported.');
        expect(() =>
            getOutputAmounts({ ...request, OutputSize: 31 }, new DeterministicRandom(0)),
        ).toThrow('Incorrect output size. Only taproot is supported');
    });
});
