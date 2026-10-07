import { solanaUtils } from '@trezor/blockchain-link-utils';
import type { GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ChainSignedTransaction,
    type SignChainTransactionParams,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';

export type SignSolanaTransactionDeps = GetTrezorConnectDep<
    'blockchainGetInfo' | 'solanaComposeTransaction' | 'solanaSignTransaction'
>;

export type SignSolanaTransaction = (
    params: SignChainTransactionParams,
) => Promise<ChainSignedTransaction>;

/** Builds the transaction on a fresh blockhash with the approved priority fee and signs it. */
export const createSignSolanaTransaction =
    (deps: SignSolanaTransactionDeps): SignSolanaTransaction =>
    async ({ account, draft, precomposed, options }) => {
        const { symbol } = account;
        const connect = deps.getTrezorConnect();

        if (precomposed.feeLimit == null) {
            throw new ChainSendError('sign-failed', symbol, 'Fee limit missing.');
        }

        const { token } = precomposed;

        const blockchainInfo = await connect.blockchainGetInfo({
            coin: toCoinSymbol(symbol),
            identity: account.deviceState,
        });
        if (!blockchainInfo.success) {
            throw new ChainSendError('sign-failed', symbol, 'Failed to fetch blockchain info.');
        }
        const { blockHash, blockHeight: lastValidBlockHeight } = blockchainInfo.payload;

        const { outputs: signOutputs } = draft;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignOutput: (typeof signOutputs)[number] = signOutputs[0];
        const transaction = await connect.solanaComposeTransaction({
            fromAddress: account.descriptor,
            toAddress: firstSignOutput.address,
            amount: firstSignOutput.amount,
            token: token
                ? {
                      mint: token.contract,
                      program: solanaUtils.tokenStandardToTokenProgramName(token.standard),
                      decimals: token.decimals,
                      accounts: token.accounts ?? [],
                  }
                : undefined,
            blockHash,
            lastValidBlockHeight,
            memo: draft.destinationTag || undefined,
            priorityFees: {
                computeUnitPrice: precomposed.feePerByte,
                computeUnitLimit: precomposed.feeLimit,
            },
            coin: toCoinSymbol(symbol),
            identity: account.deviceState,
            serializedTx: draft.transactionData,
        });

        if (!transaction.success) {
            throw new ChainSendError('sign-failed', symbol, transaction.error.message);
        }

        const response = await connect.solanaSignTransaction({
            device: options.device,
            path: account.path,
            serializedTx: transaction.payload.serializedTx,
            payment_req: options.paymentRequests?.[0],
            serialize: true,
            additionalInfo: transaction.payload.additionalInfo.tokenAccountInfo
                ? {
                      tokenAccountsInfos: [transaction.payload.additionalInfo.tokenAccountInfo],
                  }
                : undefined,
            chunkify: options.chunkify,
        });

        if (!response.success) {
            throw new ChainSendError(
                'sign-failed',
                symbol,
                response.error.message,
                response.error.code,
            );
        }

        return { serializedTx: response.payload.serializedTx! };
    };
