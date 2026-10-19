import {
    LIQUIDITY_CLUE_BINARY_VERSION,
    getLiquidityClueFixtures,
    initLiquidityClueFixtures,
    updateLiquidityClueFixtures,
} from './__fixtures__/liquidityClue.fixture';
import { getLiquidityClue, initLiquidityClue, updateLiquidityClue } from './liquidityClue';

const { Version, CommitHash } = LIQUIDITY_CLUE_BINARY_VERSION;

// The binary version is part of the suite name so that a stale fixture set is visible in the test
// output rather than silently diverging from the bundled binary.
describe(`liquidity clue parity with WabiSabiClientLibrary ${Version} (${CommitHash})`, () => {
    describe('initLiquidityClue', () => {
        initLiquidityClueFixtures.forEach(({ description, request, response }) => {
            it(description, () => {
                expect(initLiquidityClue(request.ExternalAmounts)).toBe(response.RawLiquidityClue);
            });
        });
    });

    describe('updateLiquidityClue', () => {
        updateLiquidityClueFixtures.forEach(({ description, request, response }) => {
            it(description, () => {
                expect(
                    updateLiquidityClue(
                        request.RawLiquidityClue,
                        request.MaxSuggestedAmount,
                        request.ExternalAmounts,
                    ),
                ).toBe(response.RawLiquidityClue);
            });
        });
    });

    describe('getLiquidityClue', () => {
        getLiquidityClueFixtures.forEach(({ description, request, response }) => {
            it(description, () => {
                expect(getLiquidityClue(request.RawLiquidityClue, request.MaxSuggestedAmount)).toBe(
                    response.LiquidityClue,
                );
            });
        });
    });
});
