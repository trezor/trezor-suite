import {
    CryptoAmountFormatter,
    TokenAmountFormatter,
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
            <CryptoAmountFormatter
                formatStyle="compact-balance"
                value={item.balance}
                symbol={item.symbol}
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
                numberOfLines={1}
                adjustsFontSizeToFit
                variant="body-md"
                color="contentPrimary"
            />
        );
    }

    return (
        <TokenAmountFormatter
            formatStyle="compact-balance"
            value={asDecimalTokenAmount(item.balance)}
            symbol={item.tokenSymbol}
            decimals={item.tokenDecimals}
            numberOfLines={1}
            adjustsFontSizeToFit
            variant="body-md"
            color="contentPrimary"
        />
    );
};
