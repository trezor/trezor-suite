import { type PaymentRequestOutput } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import type { Network } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: blocked on blockchain plugin modularisation; remove this exception once Solana helpers are exposed via a public API (see #27376 deferred work)
import { getAssociatedTokenAccountAddress } from '@trezor/connect/src/api/solana/solanaUtils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingSendRejectedProps } from '../../types';
import { formatSlip24SendAmountByNetwork } from '../../utils/signature/signatureUtils';

export const getPaymentRequestOutputs = createThunk<
    PaymentRequestOutput[],
    { network: Network; composedLevels: GeneralPrecomposedTransactionFinal },
    { rejectValue: TradingSendRejectedProps }
>(
    `${TRADING_THUNK_PREFIX}/getPaymentRequestOutputs`,
    async ({ network, composedLevels }, { rejectWithValue, fulfillWithValue }) => {
        const outputs: PaymentRequestOutput[] = [];

        for (const output of composedLevels.outputs) {
            const amount = formatSlip24SendAmountByNetwork({ value: output.amount, network });
            if ('address' in output && output.address) {
                let sendAddress = output.address;

                // solana sends tokens to associated token accounts not to base account
                if (network.networkType === 'solana' && composedLevels?.token?.contract) {
                    try {
                        const { contract, standard } = composedLevels.token;
                        const associatedTokenAccountAddress =
                            await getAssociatedTokenAccountAddress(
                                output.address,
                                contract,
                                standard === 'SPL' ? 'spl-token' : 'spl-token-2022',
                            );

                        sendAddress = associatedTokenAccountAddress.toString();
                    } catch {
                        return rejectWithValue({
                            type: 'sign-tx-error',
                            error: {
                                id: 'TR_PAYMENT_REQUESTS_ERROR',
                            },
                        });
                    }
                }

                outputs.push({
                    amount,
                    address: sendAddress,
                });
            }

            if ('address_n' in output && output.address_n) {
                const getAddress = await TrezorConnect.getAddress({
                    path: output.address_n,
                    showOnTrezor: false,
                    keepSession: true,
                });

                if (!getAddress.success) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                outputs.push({
                    amount: formatSlip24SendAmountByNetwork({ value: output.amount, network }),
                    address: getAddress.payload.address,
                });
            }
        }

        return fulfillWithValue(outputs);
    },
);
