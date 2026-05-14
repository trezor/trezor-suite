import { SYSTEM_PROGRAM_PUBLIC_KEY } from '@trezor/blockchain-link-utils/src/solana';
import type { CoinInfo, MethodPermission } from '@trezor/connect-common';
import { SolanaComposeTransaction as SolanaComposeTransactionSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { initBlockchain, isBackendSupported } from '../../../backend/BlockchainLink';
import type { MethodContext, MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
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
    constructor(message: MethodMessage<'solanaComposeTransaction'>) {
        const { payload } = message;

        // validate bundle type
        Assert(SolanaComposeTransactionSchema, payload);

        const coinInfo = getCoinInfo(payload.coin || 'sol');
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        const params = { coinInfo, ...payload };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    get info() {
        return 'Compose Solana transaction';
    }

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        // if the serializedTx is set, there is nothing to compose
        if (this.params.serializedTx) {
            return {
                serializedTx: this.params.serializedTx,
                additionalInfo: {},
            };
        }

        if (!this.params.toAddress) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'toAddress not found');
        }

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
                      this.params.memo,
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
                  this.params.memo,
              );

        const isCreatingAccount =
            this.params.token &&
            recipientTokenAccounts === undefined &&
            // if the recipient account has no owner, it means it's a new account and needs the token account to be created
            (recipientAccountOwner === SYSTEM_PROGRAM_PUBLIC_KEY || recipientAccountOwner == null);
        const newAccountProgramName = isCreatingAccount ? this.params.token?.program : undefined;

        return {
            serializedTx: tx.serialize(),
            additionalInfo: {
                newAccountProgramName,
                tokenAccountInfo: tokenTransferTxAndDestinationAddress?.tokenAccountInfo,
            },
        };
    }
}
