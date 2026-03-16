import { type PaymentRequestOutput } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import type { Network } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

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
            if ('address' in output && output.address) {
                outputs.push({
                    amount: formatSlip24SendAmountByNetwork({ value: output.amount, network }),
                    address: output.address,
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
