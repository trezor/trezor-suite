import type { SolanaTxTokenAccountInfo } from '@trezor/connect-common';

import SolanaSignTransaction from './solanaSignTransaction';
import {
    MINT,
    OTHER_TOKEN_ACCOUNT,
    RECIPIENT,
    RECIPIENT_TOKEN_ACCOUNT,
    TOKEN_2022_PROGRAM,
    TOKEN_PROGRAM,
    solTransferTx,
    tokenAndSolTransferTx,
    tokenTransferToOtherAccountTx,
    tokenTransferTx,
    tokenTransferWithPlainTransferTx,
    twoTokenTransfersTx,
} from '../__fixtures__/solanaSignTransaction';

const getPrecomposed = (serializedTx: string, tokenAccountsInfos?: SolanaTxTokenAccountInfo[]) =>
    new SolanaSignTransaction({
        payload: {
            method: 'solanaSignTransaction',
            path: "m/44'/501'/0'/0'",
            serializedTx,
            additionalInfo: tokenAccountsInfos ? { tokenAccountsInfos } : undefined,
        },
    }).payloadToPrecomposed();

const tokenAccountInfo = (
    tokenAccount: string,
    tokenProgram = TOKEN_PROGRAM,
): SolanaTxTokenAccountInfo => ({
    baseAddress: RECIPIENT,
    tokenProgram,
    tokenMint: MINT,
    tokenAccount,
});

describe('SolanaSignTransaction payloadToPrecomposed', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('shows the base address of a token transfer to its associated token account', async () => {
        const precomposed = await getPrecomposed(tokenTransferTx, [
            tokenAccountInfo(RECIPIENT_TOKEN_ACCOUNT),
        ]);

        expect(precomposed?.outputs).toEqual([
            { address: RECIPIENT, amount: '1000000', script_type: 'PAYTOADDRESS' },
        ]);
    });

    it('shows the token account when the base address does not own it', async () => {
        const precomposed = await getPrecomposed(tokenTransferToOtherAccountTx, [
            tokenAccountInfo(OTHER_TOKEN_ACCOUNT),
        ]);

        expect(precomposed?.outputs).toEqual([
            { address: OTHER_TOKEN_ACCOUNT, amount: '1000000', script_type: 'PAYTOADDRESS' },
        ]);
    });

    it('shows the token account when the token account info names another token program', async () => {
        const precomposed = await getPrecomposed(tokenTransferTx, [
            tokenAccountInfo(RECIPIENT_TOKEN_ACCOUNT, TOKEN_2022_PROGRAM),
        ]);

        expect(precomposed?.outputs).toEqual([
            { address: RECIPIENT_TOKEN_ACCOUNT, amount: '1000000', script_type: 'PAYTOADDRESS' },
        ]);
    });

    it('builds no review of a transaction with an instruction it does not decode', async () => {
        const precomposed = await getPrecomposed(tokenTransferWithPlainTransferTx, [
            tokenAccountInfo(RECIPIENT_TOKEN_ACCOUNT),
        ]);

        expect(precomposed).toBeUndefined();
    });

    it.each([
        ['a SOL transfer', tokenAndSolTransferTx],
        ['another token transfer', twoTokenTransfersTx],
    ])('builds no review of a token transfer combined with %s', async (_name, serializedTx) => {
        const precomposed = await getPrecomposed(serializedTx, [
            tokenAccountInfo(RECIPIENT_TOKEN_ACCOUNT),
        ]);

        expect(precomposed).toBeUndefined();
    });

    it('builds a review of a SOL transfer with compute budget instructions', async () => {
        const precomposed = await getPrecomposed(solTransferTx);

        expect(precomposed).toMatchObject({
            outputs: [{ address: RECIPIENT, amount: '1000000', script_type: 'PAYTOADDRESS' }],
            totalSpent: '1025000',
            fee: '25000',
        });
    });
});
