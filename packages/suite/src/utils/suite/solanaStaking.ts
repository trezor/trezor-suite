import { VersionedTransaction, PublicKey } from '@solana/web3.js-version1';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { LAMPORTS_PER_SOL, WALLET_SDK_SOURCE } from '@suite-common/wallet-constants';
import { selectSolanaWalletSdkNetwork } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';
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

        const lamports = new BigNumber(LAMPORTS_PER_SOL).multipliedBy(amount).toNumber(); // stake method expects lamports as a number
        const tx = await solanaClient.stake(from, lamports, WALLET_SDK_SOURCE);
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
