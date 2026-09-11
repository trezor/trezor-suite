import { address, createNoopSigner } from '@solana/kit';
import * as splToken from '@solana-program/token';
import * as splToken2022 from '@solana-program/token-2022';

import { getAccountCreationFee } from './fees';
import { type SolanaAPI } from '../types';

const payer = createNoopSigner(address('ANctUhC7YZPueiv4T8bkDcHYEAJ7Hwoxhvgnr2QkF8uR'));
const owner = address('5Q9c3XoBef8BYA5RzSmogWnRrQas6HPwYuo4AYPafpom');
const mint = address('HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL');
const tokenAccount = address('73rsTqUoMd34Y3YwXtu4An2LkncLF9SeDY6TGUFfksfe');
const token2022Account = address('3nn86A71hFhoqYgPqLWSXdoxUwtfJNWoevBQUouAjSEg');

const createApi = ({
    accounts = [],
    rents = [100n],
}: {
    accounts?: unknown[];
    rents?: bigint[];
} = {}) => {
    const rentResponses = rents.map(rent => jest.fn().mockResolvedValue(rent));
    const getMinimumBalanceForRentExemption = jest.fn(() => ({
        send: rentResponses.shift() ?? jest.fn().mockResolvedValue(BigInt(0)),
    }));

    return {
        api: {
            rpc: {
                getMinimumBalanceForRentExemption,
                getMultipleAccounts: jest.fn(() => ({
                    send: jest.fn().mockResolvedValue({ value: accounts }),
                })),
            },
        } as unknown as SolanaAPI,
        getMinimumBalanceForRentExemption,
    };
};

describe('getAccountCreationFee', () => {
    it('sums rent for every token account created by the transaction', async () => {
        const { api, getMinimumBalanceForRentExemption } = createApi({
            rents: [100n, 200n],
        });
        const instructions = [
            splToken.getCreateAssociatedTokenInstruction({
                ata: tokenAccount,
                mint,
                owner,
                payer,
            }),
            splToken2022.getCreateAssociatedTokenInstruction({
                ata: token2022Account,
                mint,
                owner,
                payer,
            }),
        ];

        const fee = await getAccountCreationFee({
            api,
            feePayer: payer.address,
            instructions,
            newAccountProgramName: undefined,
        });

        expect(fee).toBe(300n);
        expect(getMinimumBalanceForRentExemption).toHaveBeenCalledTimes(2);
    });

    it('does not reserve rent when an idempotently-created account already exists', async () => {
        const { api, getMinimumBalanceForRentExemption } = createApi({
            accounts: [{ data: ['', 'base64'] }],
        });
        const instruction = splToken.getCreateAssociatedTokenIdempotentInstruction({
            ata: tokenAccount,
            mint,
            owner,
            payer,
        });

        const fee = await getAccountCreationFee({
            api,
            feePayer: payer.address,
            instructions: [instruction],
            newAccountProgramName: undefined,
        });

        expect(fee).toBe(0n);
        expect(getMinimumBalanceForRentExemption).not.toHaveBeenCalled();
    });

    it('reserves rent when an idempotently-created account does not exist', async () => {
        const { api, getMinimumBalanceForRentExemption } = createApi({
            accounts: [null],
            rents: [100n],
        });
        const instruction = splToken.getCreateAssociatedTokenIdempotentInstruction({
            ata: tokenAccount,
            mint,
            owner,
            payer,
        });

        const fee = await getAccountCreationFee({
            api,
            feePayer: payer.address,
            instructions: [instruction],
            newAccountProgramName: undefined,
        });

        expect(fee).toBe(100n);
        expect(getMinimumBalanceForRentExemption).toHaveBeenCalledTimes(1);
    });

    it('does not reserve rent paid by another account', async () => {
        const { api, getMinimumBalanceForRentExemption } = createApi();
        const instruction = splToken.getCreateAssociatedTokenInstruction({
            ata: tokenAccount,
            mint,
            owner,
            payer: createNoopSigner(owner),
        });

        const fee = await getAccountCreationFee({
            api,
            feePayer: payer.address,
            instructions: [instruction],
            newAccountProgramName: undefined,
        });

        expect(fee).toBe(0n);
        expect(getMinimumBalanceForRentExemption).not.toHaveBeenCalled();
    });

    it('uses the legacy account program hint only when it was not detected in the transaction', async () => {
        const { api, getMinimumBalanceForRentExemption } = createApi({ rents: [100n] });
        const instruction = splToken.getCreateAssociatedTokenInstruction({
            ata: tokenAccount,
            mint,
            owner,
            payer,
        });

        const fee = await getAccountCreationFee({
            api,
            feePayer: payer.address,
            instructions: [instruction],
            newAccountProgramName: 'spl-token',
        });

        expect(fee).toBe(100n);
        expect(getMinimumBalanceForRentExemption).toHaveBeenCalledTimes(1);
    });
});
