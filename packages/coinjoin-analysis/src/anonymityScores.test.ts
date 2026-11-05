import getAnonymityScoresVectors from './__fixtures__/getAnonymityScores.json';
import { type AnalyzeTransactionDetails, getAnonymityScores } from './getAnonymityScores';

/**
 * Parity against
 * `WalletWasabi.WabiSabiClientLibrary.Tests/IntegrationTests/TestVectors/GetAnonymityScores.json`
 * and `UnitTests/Controllers/Helpers/GetAnonymityScoresHelperTests.cs`.
 *
 * Two of the four committed vectors assert ASP.NET model-validation and Newtonsoft
 * deserialization failures (`"The Transactions field is required."` and
 * `"Unable to cast object of type 'System.String' …"`). Those are HTTP-layer behaviour of
 * a binary that no longer exists; there is no in-process equivalent, so they are skipped
 * and listed here rather than silently dropped.
 */
describe('getAnonymityScores — upstream test vectors', () => {
    const vectors = getAnonymityScoresVectors as {
        Name: string;
        Request: { Transactions?: AnalyzeTransactionDetails[] };
        ExpectedStatusCode: number;
        ExpectedResponse: { Results?: unknown; Description?: string };
    }[];

    it('vector 0 produces the expected scores', () => {
        const vector = vectors[0]!;
        expect(getAnonymityScores(vector.Request.Transactions!)).toEqual(
            vector.ExpectedResponse.Results,
        );
    });

    it('vector 1 rejects an internal input with no known transaction', () => {
        const vector = vectors[1]!;
        expect(() => getAnonymityScores(vector.Request.Transactions!)).toThrow(
            vector.ExpectedResponse.Description as string,
        );
    });

    it.each([2, 3])(
        'vector %i only asserts HTTP-layer validation, which has no in-process equivalent',
        index => {
            // Kept so that the vector file stays complete and the omission is visible.
            expect(vectors[index]!.ExpectedStatusCode).toBe(500);
        },
    );
});

/** Port of `UnitTests/Controllers/Helpers/GetAnonymityScoresHelperTests.cs`. */
describe('getAnonymityScores', () => {
    it('returns nothing for no transactions', () => {
        expect(getAnonymityScores([])).toEqual([]);
    });

    it('gives a received output an anonymity set of one', () => {
        expect(
            getAnonymityScores([
                {
                    InternalInputs: [],
                    ExternalInputs: [{ ScriptPubKey: `0014${'11'.repeat(20)}`, Value: 100_000 }],
                    InternalOutputs: [{ Address: 'addr-a', Value: 90_000 }],
                    ExternalOutputs: [],
                },
            ]),
        ).toEqual([{ Address: 'addr-a', AnonymitySet: 1 }]);
    });

    it('reports each address once, with the score it had when it first appeared', () => {
        // Newest first, as Suite sends them: the receive is the older transaction.
        const transactions: AnalyzeTransactionDetails[] = [
            {
                // A normal spend of the received coin to a foreign address plus change.
                InternalInputs: [{ Address: 'addr-a', Value: 90_000 }],
                ExternalInputs: [],
                InternalOutputs: [{ Address: 'addr-b', Value: 40_000 }],
                ExternalOutputs: [{ ScriptPubKey: `0014${'22'.repeat(20)}`, Value: 45_000 }],
            },
            {
                InternalInputs: [],
                ExternalInputs: [{ ScriptPubKey: `0014${'11'.repeat(20)}`, Value: 100_000 }],
                InternalOutputs: [{ Address: 'addr-a', Value: 90_000 }],
                ExternalOutputs: [],
            },
        ];

        const results = getAnonymityScores(transactions);

        expect(results.map(r => r.Address)).toEqual(['addr-a', 'addr-b']);
        expect(new Set(results.map(r => r.Address)).size).toBe(results.length);
        // A normal spend drops everything it touches to 1.
        expect(results).toEqual([
            { Address: 'addr-a', AnonymitySet: 1 },
            { Address: 'addr-b', AnonymitySet: 1 },
        ]);
    });

    it('does not let an external input contribute its value', () => {
        // Two requests that differ only in the declared value of an external input must
        // score identically, because `ExternalInput` upstream is a record with no fields.
        const build = (externalValue: number): AnalyzeTransactionDetails[] => [
            {
                InternalInputs: [],
                ExternalInputs: [{ ScriptPubKey: `0014${'11'.repeat(20)}`, Value: externalValue }],
                InternalOutputs: [{ Address: 'addr-a', Value: 90_000 }],
                ExternalOutputs: [],
            },
        ];

        expect(getAnonymityScores(build(1))).toEqual(getAnonymityScores(build(10_000_000)));
    });
});
