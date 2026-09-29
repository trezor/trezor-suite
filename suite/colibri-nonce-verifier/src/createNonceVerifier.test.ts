import { type ColibriRuntimeKind } from './colibriRuntime';
import { mockVerifierScenarios } from '../mocks/mockVerifierScenarios';

// CI and developer machines with a matching prebuild exercise the native addon. Jest's module VM
// cannot load Colibri's WASM glue, so hosts without a prebuild run the same scenarios through
// `yarn test:fixtures:wasm` instead (see scripts/fixtureSmoke.ts).
const RUNTIME_KINDS: ColibriRuntimeKind[] =
    process.env.COLIBRI_TEST_RUNTIME === 'wasm' ? ['wasm'] : ['native'];

describe('createNonceVerifier', () => {
    // A cold bootstrap replays ~450 KB of consensus data; give the native run headroom over jest's 5 s.
    it.each(mockVerifierScenarios.map(scenario => [scenario.name, scenario] as const))(
        '%s',
        async (_name, scenario) => {
            await scenario.run(RUNTIME_KINDS);
        },
        30_000,
    );
});
