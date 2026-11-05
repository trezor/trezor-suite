import { type PaymentRequestOutput } from 'invity-api';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import type { Network } from '@suite-common/wallet-config';
import { type Account, type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import solana from '@trezor/network-solana/runtime';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingError } from '../../types';
import {
    formatSlip24AddressByNetwork,
    formatSlip24SendAmountByNetwork,
} from '../../utils/signature/signatureUtils';
import { getConnectErrorCause, toTradingError } from '../../utils/tradingErrorUtils';

export type GetPaymentRequestOutputsThunkState = DeviceRootState;

export const getPaymentRequestOutputsThunk = createThunk<
    PaymentRequestOutput[],
    {
        account: Account;
        network: Network;
        composedLevels: GeneralPrecomposedTransactionFinal;
        destinationTag?: string;
    },
    { rejectValue: TradingError; state: GetPaymentRequestOutputsThunkState }
>(
    `${TRADING_THUNK_PREFIX}/getPaymentRequestOutputs`,
    async (
        { account, network, composedLevels, destinationTag },
        { getState, rejectWithValue, fulfillWithValue },
    ) => {
        const outputs: PaymentRequestOutput[] = [];

        for (const output of composedLevels.outputs) {
            const amount = formatSlip24SendAmountByNetwork({ value: output.amount, network });
            if ('address' in output && output.address) {
                let sendAddress = output.address;

                // solana sends tokens to associated token accounts not to base account
                if (network.networkType === 'solana' && composedLevels?.token?.contract) {
                    try {
                        const { contract, standard } = composedLevels.token;
                        const { getAssociatedTokenAccountAddress } = await solana();
                        const associatedTokenAccountAddress =
                            await getAssociatedTokenAccountAddress(
                                output.address,
                                contract,
                                standard === 'SPL' ? 'spl-token' : 'spl-token-2022',
                            );

                        sendAddress = associatedTokenAccountAddress.toString();
                    } catch (error) {
                        return rejectWithValue(
                            toTradingError(error, {
                                type: 'sign-tx-error',
                                code: 'payment-requests-failed',
                            }),
                        );
                    }
                }

                outputs.push({
                    amount,
                    address: formatSlip24AddressByNetwork({
                        address: sendAddress,
                        network,
                        destinationTag,
                    }),
                });
            }

            if ('address_n' in output && output.address_n) {
                const device = selectSelectedDevice(getState());

                if (!device) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        code: 'device-not-connected',
                    });
                }

                const getAddress = await TrezorConnect.getAddress({
                    device,
                    path: output.address_n,
                    coin: asCoinSymbol(account.symbol),
                    unlockPath: account.unlockPath,
                    showOnTrezor: false,
                    keepSession: true,
                });

                if (!getAddress.success) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        code: 'payment-requests-failed',
                        cause: getConnectErrorCause(getAddress.error),
                    });
                }

                outputs.push({
                    amount: formatSlip24SendAmountByNetwork({ value: output.amount, network }),
                    address: formatSlip24AddressByNetwork({
                        address: getAddress.payload.address,
                        network,
                    }),
                });
            }
        }

        return fulfillWithValue(outputs);
    },
);
