import { CryptoAmountFormatter } from '@suite-native/formatters';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { type EarnDepositsCardActiveItem } from '../../types';

type EarnAccountCardValueProps = {
    item: EarnDepositsCardActiveItem;
};

export const EarnAccountCardValue = ({ item }: EarnAccountCardValueProps) => {
    if (item.type === 'staking') {
        return (
            <CryptoAmountFormatter
                formatStyle="compact-balance"
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
            <CryptoAmountFormatter
                formatStyle="compact-balance"
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
        <CryptoAmountFormatter
            formatStyle="compact-balance"
            value={item.balance}
            tokenSymbol={item.tokenSymbol}
            tokenDecimals={item.tokenDecimals}
            numberOfLines={1}
            adjustsFontSizeToFit
            variant="body-md"
            color="contentPrimary"
        />
    );
};
