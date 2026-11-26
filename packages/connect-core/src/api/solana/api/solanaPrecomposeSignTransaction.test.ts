import { v1Message } from './__fixtures__/solanaMessages';
import SolanaPrecomposeSignTransaction from './solanaPrecomposeSignTransaction';

const precompose = (serializedTx: string) =>
    new SolanaPrecomposeSignTransaction({
        payload: {
            method: 'solanaPrecomposeSignTransaction',
            path: "m/44'/501'/0'/0'",
            serializedTx,
        },
    }).run();

describe('SolanaPrecomposeSignTransaction', () => {
    it('precomposes a v1 transaction with the priority fee from its config', async () => {
        await expect(precompose(v1Message)).resolves.toMatchObject({
            outputs: [
                { address: 'H9YxYwVaQkK5aMZDmYc99vGDu9UEXK2FVsDLrUkEzLAX', amount: '1000000' },
            ],
            fee: '17345',
            totalSpent: '1017345',
        });
    });

    it('fails for a message it cannot decode', async () => {
        await expect(precompose('00')).rejects.toThrow();
    });
});
