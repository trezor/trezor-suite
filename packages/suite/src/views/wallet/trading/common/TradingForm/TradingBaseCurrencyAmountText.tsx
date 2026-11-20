import { useSelector } from 'react-redux';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { selectLanguage } from '@suite/settings';
import { getFormattedCurrencySymbol } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { getFiatRateKey, parseCryptoToFormattedBaseCurrency } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';
import { BigNumber, localizeNumber } from '@trezor/utils';

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
    const isNativeToken = !tokenAddress || tokenAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;
    const rateTokenAddress = isNativeToken ? undefined : tokenAddress;
    const rate = useSelector(
        (state: FiatRatesRootState) =>
            selectFiatRatesByFiatRateKey(
                state,
                getFiatRateKey(symbol, baseCurrency, rateTokenAddress),
                'current',
            )?.rate,
    );

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
