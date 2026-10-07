import type { GetTrezorConnectDep, RipplePayment } from '@trezor/connect-common';
import {
    type ChainSendAccount,
    ChainSendError,
    type ChainSignedTransaction,
    type SignChainTransactionParams,
    coinAmountToSmallestUnit,
} from '@trezor/network-module-suite-common-types';
import { XRP_FLAG } from '@trezor/network-ripple/constants';

import type { RippleSendConfig } from './types';

export type SignRippleTransactionDeps = GetTrezorConnectDep<'rippleSignTransaction'>;

export type SignRippleTransactionParams = SignChainTransactionParams & { config: RippleSendConfig };

export type SignRippleTransaction = (
    params: SignRippleTransactionParams,
) => Promise<ChainSignedTransaction>;

type RippleAccountMisc = { sequence: number };

/** The family data of an account this network already checked to be its own. */
const readRippleAccountMisc = (account: ChainSendAccount) => account.misc as RippleAccountMisc;

/** Signs an XRP payment at the account's next sequence. */
export const createSignRippleTransaction =
    (deps: SignRippleTransactionDeps): SignRippleTransaction =>
    async ({ account, draft, precomposed, options, config }) => {
        const { outputs: signOutputs } = draft;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignOutput: (typeof signOutputs)[number] = signOutputs[0];

        const payment: RipplePayment = {
            destination: firstSignOutput.address,
            amount: coinAmountToSmallestUnit(firstSignOutput.amount, config.decimals),
        };

        if (draft.destinationTag) {
            payment.destinationTag = parseInt(draft.destinationTag, 10);
        }

        const response = await deps.getTrezorConnect().rippleSignTransaction({
            device: options.device,
            path: account.path,
            transaction: {
                fee: precomposed.feePerByte,
                flags: XRP_FLAG,
                sequence: readRippleAccountMisc(account).sequence,
                payment,
            },
            payment_req: options.paymentRequests?.[0],
            chunkify: options.chunkify,
        });

        if (!response.success) {
            throw new ChainSendError(
                'sign-failed',
                account.symbol,
                response.error.message,
                response.error.code,
            );
        }

        return { serializedTx: response.payload.serializedTx };
    };
