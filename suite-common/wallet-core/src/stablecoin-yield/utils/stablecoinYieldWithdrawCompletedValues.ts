import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';

import type {
    YieldFlowCompleteValue,
    YieldFlowDisplayToken,
    YieldFlowToken,
    YieldWithdrawFlowType,
} from '../stablecoinYieldTypes';
import {
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getWithdrawRequestAmount,
} from './stablecoinYieldUtils';

type PricePerShareState = NonNullable<YieldDtoV2['state']>['pricePerShareState'];

type GetYieldWithdrawCompletedValuesParams = {
    networkSymbol: NetworkSymbol;
    flowType: YieldWithdrawFlowType;
    completedAmount: string;
    unwrappedAmount: string | null;
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
    pricePerShareState: PricePerShareState;
};

type YieldWithdrawCompletedValues = {
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
};

/**
 * Build the "sent → received" pair shown on the withdrawal-complete screen.
 *
 * A vault withdrawal always spends the vault receipt token (e.g. trSHETHp) and returns the
 * underlying token (WETH) — or the native token (ETH) when the user unwraps. The completion screen
 * must communicate that outgoing receipt token in every case (issue #30548), not only for the
 * `redeem` unit.
 *
 * `completedAmount` is expressed in the input unit: shares for `redeem`, the underlying asset for
 * `withdraw`. The receipt (shares) amount for the `withdraw` unit is therefore derived from the
 * vault price-per-share, mirroring how the deposit flow derives its received receipt amount.
 */
export const getYieldWithdrawCompletedValues = ({
    networkSymbol,
    flowType,
    completedAmount,
    unwrappedAmount,
    token,
    receiptToken,
    pricePerShareState,
}: GetYieldWithdrawCompletedValuesParams): YieldWithdrawCompletedValues => {
    const isSharesInput = flowType === 'redeem';

    const sentReceiptAmount = isSharesInput
        ? completedAmount
        : (getWithdrawRequestAmount({
              networkSymbol,
              amount: completedAmount,
              token,
              receiptToken,
              pricePerShare: pricePerShareState?.price,
          }) ?? completedAmount);

    const input: YieldFlowCompleteValue = {
        token: receiptToken,
        amount: sentReceiptAmount,
    };

    if (unwrappedAmount !== null) {
        return {
            input,
            output: {
                token: {
                    networkSymbol,
                    symbol: getNetworkDisplaySymbol(networkSymbol),
                    decimals: getNetwork(networkSymbol).decimals,
                },
                amount: unwrappedAmount,
            },
        };
    }

    return {
        input,
        output: {
            token,
            amount:
                isSharesInput && pricePerShareState
                    ? getConvertedOutputTokenBalanceToInputTokenAmount({
                          networkSymbol,
                          token,
                          outputToken: receiptToken,
                          outputTokenBalance: completedAmount,
                          pricePerShareState,
                      })
                    : completedAmount,
        },
    };
};
