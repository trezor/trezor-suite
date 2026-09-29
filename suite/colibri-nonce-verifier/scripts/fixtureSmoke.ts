// Runs the fixture-driven verifier scenarios outside jest, so hosts without a native Colibri
// prebuild can still exercise the same C core through its WASM build:
//   COLIBRI_TEST_RUNTIME=wasm yarn workspace @suite/colibri-nonce-verifier test:fixtures
import { mockVerifierScenarios } from '../mocks/mockVerifierScenarios';
import type { ColibriRuntimeKind } from '../src/colibriRuntime';

const runtimeKinds: ColibriRuntimeKind[] =
    process.env.COLIBRI_TEST_RUNTIME === 'native' ? ['native'] : ['wasm'];

const print = (line: string) => process.stdout.write(`${line}\n`);

const run = async () => {
    let failed = 0;
    for (const scenario of mockVerifierScenarios) {
        const started = performance.now();
        try {
            await scenario.run(runtimeKinds);
            print(`ok   ${scenario.name} (${Math.round(performance.now() - started)} ms)`);
        } catch (error) {
            failed += 1;
            print(`FAIL ${scenario.name}`);
            print(error instanceof Error ? (error.stack ?? error.message) : String(error));
        }
    }
    print(
        `${mockVerifierScenarios.length - failed}/${mockVerifierScenarios.length} scenarios passed on the ${runtimeKinds[0]} runtime`,
    );
    process.exit(failed === 0 ? 0 : 1);
};

run().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
