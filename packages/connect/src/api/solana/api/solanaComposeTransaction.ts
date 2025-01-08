import { Assert } from '@trezor/schema-utils';
import { SYSTEM_PROGRAM_PUBLIC_KEY } from '@trezor/blockchain-link-utils/src/solana';

import { AbstractMethod } from '../../../core/AbstractMethod';
import { SolanaComposeTransaction as SolanaComposeTransactionSchema } from '../../../types/api/solana';
import { ERRORS } from '../../../constants';
import { CoinInfo } from '../../../types';
import { initBlockchain, isBackendSupported } from '../../../backend/BlockchainLink';
import { getCoinInfo } from '../../../data/coinInfo';
import {
    buildTokenTransferTransaction,
    buildTransferTransaction,
    dummyPriorityFeesForFeeEstimation,
    fetchAccountOwnerAndTokenInfoForAddress,
} from '../solanaUtils';

type SolanaComposeTransactionParams = SolanaComposeTransactionSchema & {
    coinInfo: CoinInfo;
};

export default class SolanaComposeTransaction extends AbstractMethod<
    'solanaComposeTransaction',
    SolanaComposeTransactionParams
> {
    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate bundle type
        Assert(SolanaComposeTransactionSchema, payload);

        const coinInfo = getCoinInfo(payload.coin || 'sol');
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        this.params = {
            coinInfo,
            ...payload,
        };
    }

    get info() {
        return 'Compose Solana transaction';
    }

    async run() {
        const backend = await initBlockchain(
            this.params.coinInfo,
            this.postMessage,
            this.params.identity,
        );

        const [recipientAccountOwner, recipientTokenAccounts] = this.params.token
            ? await fetchAccountOwnerAndTokenInfoForAddress(
                  backend,
                  this.params.toAddress,
                  this.params.token.mint,
                  this.params.token.program,
              )
            : [undefined, undefined];

        const tokenTransferTxAndDestinationAddress =
            this.params.token && this.params.token.accounts
                ? await buildTokenTransferTransaction(
                      this.params.fromAddress,
                      this.params.toAddress,
                      recipientAccountOwner || SYSTEM_PROGRAM_PUBLIC_KEY, // toAddressOwner
                      this.params.token.mint,
                      this.params.amount || '0',
                      this.params.token.decimals,
                      this.params.token.accounts,
                      recipientTokenAccounts,
                      this.params.blockHash,
                      this.params.lastValidBlockHeight,
                      this.params.priorityFees || dummyPriorityFeesForFeeEstimation,
                      this.params.token.program,
                  )
                : undefined;

        if (this.params.token && !tokenTransferTxAndDestinationAddress)
            throw ERRORS.TypedError('Method_InvalidParameter', 'Token accounts not found');

        const tx = tokenTransferTxAndDestinationAddress
            ? tokenTransferTxAndDestinationAddress.transaction
            : await buildTransferTransaction(
                  this.params.fromAddress,
                  this.params.toAddress,
                  this.params.amount,
                  this.params.blockHash,
                  this.params.lastValidBlockHeight,
                  this.params.priorityFees || dummyPriorityFeesForFeeEstimation,
              );

        const isCreatingAccount =
            this.params.token &&
            recipientTokenAccounts === undefined &&
            // if the recipient account has no owner, it means it's a new account and needs the token account to be created
            (recipientAccountOwner === SYSTEM_PROGRAM_PUBLIC_KEY || recipientAccountOwner == null);
        const newTokenAccountProgramName = isCreatingAccount
            ? this.params.token?.program
            : undefined;

        return {
            serializedTx: tx.serialize(),
            additionalInfo: {
                isCreatingAccount: !!isCreatingAccount,
                newTokenAccountProgramName,
                tokenAccountInfo: tokenTransferTxAndDestinationAddress?.tokenAccountInfo,
            },
        };
    }
}
