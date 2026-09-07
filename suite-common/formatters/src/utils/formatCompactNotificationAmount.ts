import { type Locale } from '@suite-common/suite-types';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { convertAmountSubunitsToUnits, getAccountDecimals } from '@suite-common/wallet-utils';
import { type TokenTransfer } from '@trezor/connect';

import { formatCompactCryptoAmount } from './formatCompactCryptoAmount';
import { MONEY_LIKE_TOKEN_DECIMALS } from '../formatters/prepareCryptoAmountFormatter';

// FIXME: Transaction notifications bake their amount into a display string at dispatch time, so there is no
// locale in scope; keep the historical (non-localized) behavior by formatting in `en-US`.
const NOTIFICATION_LOCALE: Locale = 'en-US';

export const formatCompactNotificationNetworkAmount = (
    amount: string,
    symbol: NetworkSymbol,
    isSatoshis?: boolean,
) => {
    const decimals = getAccountDecimals(symbol);

    if (!decimals) return amount;

    // Satoshis are integer subunit counts with no fractional precision to overflow, so keep them
    // as-is rather than compacting (mirrors `formatNetworkAmount`).
    if (isSatoshis) {
        return `${amount || '0'} sat ${getNetworkDisplaySymbol(symbol)}`;
    }

    const formattedAmount = formatCompactCryptoAmount({
        value: convertAmountSubunitsToUnits(amount, decimals),
        locale: NOTIFICATION_LOCALE,
    });

    return `${formattedAmount} ${getNetworkDisplaySymbol(symbol)}`;
};

export const formatCompactNotificationTokenAmount = (
    tokenTransfer: Pick<TokenTransfer, 'amount' | 'decimals' | 'symbol'>,
) => {
    const formattedAmount = formatCompactCryptoAmount({
        value: convertAmountSubunitsToUnits(tokenTransfer.amount, tokenTransfer.decimals),
        locale: NOTIFICATION_LOCALE,
        isMoneyLike: tokenTransfer.decimals === MONEY_LIKE_TOKEN_DECIMALS,
    });

    return tokenTransfer.symbol ? `${formattedAmount} ${tokenTransfer.symbol}` : formattedAmount;
};
