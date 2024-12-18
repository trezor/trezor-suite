import { VersionedTransaction, PublicKey } from '@solana/web3.js-version1';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { WALLET_SDK_SOURCE } from '@suite-common/wallet-constants';
import {
    networkAmountToSmallestUnit,
    selectSolanaWalletSdkNetwork,
} from '@suite-common/wallet-utils';
import type { SolanaSignTransaction } from '@trezor/connect';
import { Blockchain } from '@suite-common/wallet-types';

type SolanaTx = SolanaSignTransaction & {
    versionedTx: VersionedTransaction;
};

export const transformTx = (
    tx: VersionedTransaction,
    path: string | number[],
    tokenAccountsInfos?: {
        baseAddress: string;
        tokenProgram: string;
        tokenMint: string;
        tokenAccount: string;
    }[],
): SolanaTx => {
    const serializedMessage = new Uint8Array(tx.message.serialize());
    const serializedTxHex = Buffer.from(serializedMessage).toString('hex');

    const transformedTx = {
        path,
        serializedTx: serializedTxHex,
        additionalInfo: tokenAccountsInfos ? { tokenAccountsInfos } : undefined,
        versionedTx: tx,
    };

    return transformedTx;
};

export const getPubKeyFromAddress = (address: string) => {
    return new PublicKey(address);
};

interface PrepareStakeSolTxParams {
    from: string;
    path: string | number[];
    amount: string;
    symbol: NetworkSymbol;
    selectedBlockchain: Blockchain;
}
export type PrepareStakeSolTxResponse =
    | {
          success: true;
          tx: SolanaTx;
      }
    | {
          success: false;
          errorMessage: string;
      };

export const prepareStakeSolTx = async ({
    from,
    path,
    amount,
    symbol,
    selectedBlockchain,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const solanaClient = selectSolanaWalletSdkNetwork(symbol, selectedBlockchain.url);

        const lamports = networkAmountToSmallestUnit(amount, symbol);
        const tx = await solanaClient.stake(from, Number(lamports), WALLET_SDK_SOURCE);
        const transformedTx = transformTx(tx.result, path);

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

export const prepareUnstakeSolTx = async ({
    from,
    path,
    amount,
    symbol,
    selectedBlockchain,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const solanaClient = selectSolanaWalletSdkNetwork(symbol, selectedBlockchain.url);

        const lamports = networkAmountToSmallestUnit(amount, symbol);
        const tx = await solanaClient.unstake(from, Number(lamports), WALLET_SDK_SOURCE);
        const transformedTx = transformTx(tx.result, path);

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

type PrepareClaimSolTxParams = Omit<PrepareStakeSolTxParams, 'amount'>;

export const prepareClaimSolTx = async ({
    from,
    path,
    symbol,
    selectedBlockchain,
}: PrepareClaimSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const solanaClient = selectSolanaWalletSdkNetwork(symbol, selectedBlockchain.url);

        const tx = await solanaClient.claim(from);
        const transformedTx = transformTx(tx.result, path);

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};
