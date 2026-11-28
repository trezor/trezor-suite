import { useSelector } from 'react-redux';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { selectLanguage } from '@suite/settings';
import { getFormattedCurrencySymbol } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { parseCryptoToFormattedBaseCurrency } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';
import { BigNumber, localizeNumber } from '@trezor/utils';

import { useTradingFiatRate } from '#src/hooks/wallet/trading/form/common/useTradingFiatRate';

type TradingBaseCurrencyAmountTextProps = {
    amount: string | undefined;
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
};

export const TradingBaseCurrencyAmountText = ({
    amount,
    symbol,
    tokenAddress,
}: TradingBaseCurrencyAmountTextProps) => {
    const locale = useSelector(selectLanguage);
    const baseCurrency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const rate = useTradingFiatRate({ symbol, tokenAddress });

    if (!rate) {
        return null;
    }

    const baseCurrencyLabel = getFormattedCurrencySymbol({
        locale,
        currency: baseCurrency,
        isSatsValue: isBaseCurrencyInSats,
    });

    const baseCurrencyAmount = parseCryptoToFormattedBaseCurrency({
        areSatsDisplayed: isBaseCurrencyInSats,
        baseCurrencyToSats: false,
        symbol,
        value: new BigNumber(amount ?? '0'),
        rate,
        baseCurrencyCode: baseCurrency,
    });

    return (
        <Row gap={2} alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                {baseCurrencyLabel}
            </Text>
            <Text
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
                overflowWrap="anywhere"
            >
                <HiddenPlaceholder>
                    {localizeNumber(baseCurrencyAmount ?? '0', locale)}
                </HiddenPlaceholder>
            </Text>
        </Row>
    );
};
