import { xdr } from '@stellar/stellar-sdk';

import { type SorobanServer, getContractTokenMetadata } from './soroban';

const CONTRACT = 'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM';
const OTHER_CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';

const mockServer = (retval: xdr.ScVal | undefined) => {
    const simulateTransaction = jest.fn(() => Promise.resolve({ result: { retval } }));

    return {
        server: { simulateTransaction } as unknown as SorobanServer,
        simulateTransaction,
    };
};

describe('getContractTokenMetadata', () => {
    it('reads a contract only once, since its metadata cannot change', async () => {
        const { server, simulateTransaction } = mockServer(xdr.ScVal.scvU32(7));

        const first = await getContractTokenMetadata(server, CONTRACT);
        const second = await getContractTokenMetadata(server, CONTRACT);

        // decimals + symbol + name, from the first read only
        expect(simulateTransaction).toHaveBeenCalledTimes(3);
        expect(second).toEqual(first);
        expect(second.decimals).toBe(7);
    });

    it('does not keep a read that told us nothing about the contract', async () => {
        const { server, simulateTransaction } = mockServer(undefined);

        await getContractTokenMetadata(server, OTHER_CONTRACT);
        await getContractTokenMetadata(server, OTHER_CONTRACT);

        expect(simulateTransaction).toHaveBeenCalledTimes(6);
    });
});
