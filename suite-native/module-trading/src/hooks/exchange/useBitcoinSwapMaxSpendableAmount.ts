import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingBtcSwapComposeTemplate } from '@suite-common/trading';
import { type FeesRootState, selectConvertedNetworkFeeInfo } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { BigNumber } from '@trezor/utils';

import { getBitcoinSwapMaxAmount } from '../../utils/exchange/bitcoinSwapUtils';

type BitcoinSwapMaxAmount = {
    accountKey: AccountKey;
    amount: string | undefined;
};

/**
 * Lowers the max spendable amount of a bitcoin send account so that the swap transaction can also
 * carry the extra outputs of the compose template.
 */
export const useBitcoinSwapMaxSpendableAmount = (maxSpendableAmount: string | undefined) => {
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const btcSwapComposeTemplate = useSelector(selectTradingBtcSwapComposeTemplate);
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, sendAccount?.symbol),
    );
    const [bitcoinSwapMaxAmount, setBitcoinSwapMaxAmount] = useState<BitcoinSwapMaxAmount>();

    useEffect(() => {
        if (!sendAccount) {
            return;
        }

        let isMounted = true;

        getBitcoinSwapMaxAmount({ account: sendAccount, btcSwapComposeTemplate, feeInfo }).then(
            amount => {
                if (isMounted) {
                    setBitcoinSwapMaxAmount({ accountKey: sendAccount.key, amount });
                }
            },
        );

        return () => {
            isMounted = false;
        };
    }, [sendAccount, btcSwapComposeTemplate, feeInfo]);

    const swapMaxAmount =
        bitcoinSwapMaxAmount?.accountKey === sendAccount?.key
            ? bitcoinSwapMaxAmount?.amount
            : undefined;

    if (!maxSpendableAmount || !swapMaxAmount) {
        return maxSpendableAmount;
    }

    return BigNumber.min(maxSpendableAmount, swapMaxAmount).toFixed();
};
