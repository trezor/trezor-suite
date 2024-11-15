// @ts-expect-error: Could not find a declaration file for module '@everstake/wallet-sdk/solana'.
import { stake } from '@everstake/wallet-sdk/solana';
import { LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { WALLET_SDK_SOURCE, WALLET_SDK_TOKEN } from '@suite-common/wallet-constants';
import { selectSolanaWalletSdkNetwork } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';
import type { SolanaSignTransaction } from '@trezor/connect';

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

interface PrepareStakeSolTxParams {
    from: string;
    path: string | number[];
    amount: string;
    symbol: NetworkSymbol;
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
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        selectSolanaWalletSdkNetwork(symbol);

        const lamports = new BigNumber(LAMPORTS_PER_SOL).multipliedBy(amount).toNumber(); // stake method expects lamports as a number
        const tx = await stake(WALLET_SDK_TOKEN, from, lamports, WALLET_SDK_SOURCE);
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
