import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import type {
    YieldFlowCompleteValue,
    YieldFlowDisplayToken,
    YieldWithdrawFlowType,
} from '../yieldTypes';
import {
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getWithdrawRequestAmount,
} from './yieldUtils';

type GetYieldWithdrawCompletedValuesParams = {
    networkSymbol: NetworkSymbol;
    flowType: YieldWithdrawFlowType;
    completedAmount: string;
    unwrappedAmount: string | null;
    token: YieldFlowDisplayToken;
    receiptToken: YieldFlowDisplayToken;
    vault: Pick<YieldDtoV2, 'token' | 'outputToken' | 'state'>;
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
    vault,
}: GetYieldWithdrawCompletedValuesParams): YieldWithdrawCompletedValues => {
    const isSharesInput = flowType === 'redeem';
    const pricePerShareState = vault.state?.pricePerShareState;

    const sentReceiptAmount =
        isSharesInput || !vault.outputToken
            ? completedAmount
            : (getWithdrawRequestAmount({
                  networkSymbol,
                  amount: completedAmount,
                  token: vault.token,
                  receiptToken: vault.outputToken,
                  pricePerShare: pricePerShareState?.price,
              }) ?? completedAmount);

    const input: YieldFlowCompleteValue = {
        token: receiptToken,
        amount: sentReceiptAmount,
    };

    if (unwrappedAmount !== null) {
        return {
            input,
            output: { token: { networkSymbol }, amount: unwrappedAmount },
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
                          token: vault.token,
                          outputToken: vault.outputToken,
                          outputTokenBalance: completedAmount,
                          pricePerShareState,
                      })
                    : completedAmount,
        },
    };
};
