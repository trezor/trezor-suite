import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { type EarnDepositsCardActiveItem } from '../../types';

type EarnAccountCardValueProps = {
    item: EarnDepositsCardActiveItem;
};

export const EarnAccountCardValue = ({ item }: EarnAccountCardValueProps) => {
    if (item.type === 'staking') {
        return (
            <CompactCryptoAmountFormatter
                value={item.balance}
                symbol={item.symbol}
                isBalance={true}
                numberOfLines={1}
                adjustsFontSizeToFit
                variant="body-md"
                color="contentPrimary"
            />
        );
    }

    if (isWrappedNativeToken(item.networkSymbol, item.tokenContractAddress)) {
        return (
            <CompactCryptoAmountFormatter
                value={item.balance}
                symbol={item.networkSymbol}
                isBalance={true}
                numberOfLines={1}
                adjustsFontSizeToFit
                variant="body-md"
                color="contentPrimary"
            />
        );
    }

    return (
        <CompactTokenAmountFormatter
            value={asDecimalTokenAmount(item.balance)}
            tokenSymbol={item.tokenSymbol}
            tokenDecimals={item.tokenDecimals}
            numberOfLines={1}
            adjustsFontSizeToFit
            variant="body-md"
            color="contentPrimary"
        />
    );
};
