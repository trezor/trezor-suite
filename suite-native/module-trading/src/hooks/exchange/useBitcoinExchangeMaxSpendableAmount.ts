import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingBtcSwapComposeTemplate } from '@suite-common/trading';
import { type FeesRootState, selectConvertedNetworkFeeInfo } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { BigNumber } from '@trezor/utils';

import { getBitcoinExchangeMaxAmount } from '../../utils/exchange/bitcoinExchangeUtils';

type BitcoinExchangeMaxAmount = {
    accountKey: AccountKey;
    amount: string | undefined;
};

/**
 * Returns the lower of the given max spendable amount and the max amount of a bitcoin swap.
 */
export const useBitcoinExchangeMaxSpendableAmount = (maxSpendableAmount: string | undefined) => {
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const btcSwapComposeTemplate = useSelector(selectTradingBtcSwapComposeTemplate);
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, sendAccount?.symbol),
    );
    const [bitcoinExchangeMaxAmount, setBitcoinExchangeMaxAmount] =
        useState<BitcoinExchangeMaxAmount>();

    useEffect(() => {
        if (!sendAccount) {
            return;
        }

        let isMounted = true;

        getBitcoinExchangeMaxAmount({ account: sendAccount, btcSwapComposeTemplate, feeInfo }).then(
            amount => {
                if (isMounted) {
                    setBitcoinExchangeMaxAmount({ accountKey: sendAccount.key, amount });
                }
            },
        );

        return () => {
            isMounted = false;
        };
    }, [sendAccount, btcSwapComposeTemplate, feeInfo]);

    const exchangeMaxAmount =
        bitcoinExchangeMaxAmount?.accountKey === sendAccount?.key
            ? bitcoinExchangeMaxAmount?.amount
            : undefined;

    if (!maxSpendableAmount || !exchangeMaxAmount) {
        return maxSpendableAmount;
    }

    return BigNumber.min(maxSpendableAmount, exchangeMaxAmount).toFixed();
};
