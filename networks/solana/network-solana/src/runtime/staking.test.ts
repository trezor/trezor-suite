import { getSolanaValidatorFixtures } from './__fixtures__/staking.fixture';
import { prepareStakeSolTx, selectSolanaValidator } from './staking';

describe('selectSolanaValidator', () => {
    getSolanaValidatorFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const result = selectSolanaValidator(fixture.symbol);
            expect(result).toBe(fixture.result);
        });
    });
});

describe('prepareStakeSolTx confidential-data logging', () => {
    // The sender address (`from`) and amount are confidential (never-leave-device). The staking
    // tx-build path forwards `from` to getDelegations/RPC as `sender`, and a backend/RPC failure
    // re-throws `Solana staking: staking failed - <message>` which can embed that address. Any
    // raw console.error(error) in the prepare*SolTx catch would leak it to Sentry via
    // captureConsoleIntegration, so the catch must log a static string only.
    const SENTINEL_ADDRESS = 'SoLSenTineLAddr1111111111111111111111111111';

    // Serialize each logged arg the way Sentry's captureConsoleIntegration does (Error -> message
    // + stack, everything else -> String), so an Error argument's confidential message is detected.
    const serializeLikeSentry = (arg: unknown): string =>
        arg instanceof Error ? `${arg.message}\n${arg.stack ?? ''}` : String(arg);

    it('does not log the raw error (which embeds the sender address) on failure', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Fake connection whose first RPC call (getMinimumBalanceForRentExemption().send()) rejects
        // with the sender address in the message, mimicking a real RPC error.
        const connection = {
            getMinimumBalanceForRentExemption: () => ({
                send: () => Promise.reject(new Error(`RPC error for account ${SENTINEL_ADDRESS}`)),
            }),
        } as never;

        const result = await prepareStakeSolTx({
            from: SENTINEL_ADDRESS,
            amount: '1',
            connection,
            validator: SENTINEL_ADDRESS as never,
        });

        expect(result.success).toBe(false);

        const leaked = consoleErrorSpy.mock.calls
            .flat()
            .some(arg => serializeLikeSentry(arg).includes(SENTINEL_ADDRESS));
        expect(leaked).toBe(false);

        consoleErrorSpy.mockRestore();
    });
});
