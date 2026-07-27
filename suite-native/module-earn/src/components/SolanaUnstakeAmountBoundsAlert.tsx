import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getDecimalsForBaseCurrency,
    getSolanaUnstakeAmountBounds,
} from '@suite-common/wallet-utils';
import { InlineAlertBox, Text } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    useCryptoFiatConverters,
    useFiatFromCryptoValue,
} from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { BigNumber } from '@trezor/utils';

import { type EarnFormValues } from '../earnFormSchema';

type SolanaUnstakeAmountBoundsAlertProps = {
    account: Account;
    amountValue: string;
};

export const SolanaUnstakeAmountBoundsAlert = ({
    account,
    amountValue,
}: SolanaUnstakeAmountBoundsAlertProps) => {
    const { setValue } = useFormContext<EarnFormValues>();
    const converters = useCryptoFiatConverters({ symbol: account.symbol });
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    const bounds = getSolanaUnstakeAmountBounds(account, amountValue);

    const higherFiatValue = useFiatFromCryptoValue({
        cryptoValue: bounds?.closestHigher ?? null,
        symbol: account.symbol,
        isBalance: true,
    });
    const lowerFiatValue = useFiatFromCryptoValue({
        cryptoValue: bounds?.closestLower ?? null,
        symbol: account.symbol,
        isBalance: true,
    });

    if (!bounds) return null;

    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrencyCode,
        isInSats: isBaseCurrencyInSats,
    });

    const handleSelectAmount = (amount: string) => {
        setValue('amount', amount, { shouldValidate: true });

        const fiatValue = converters?.convertCryptoToFiat?.(new BigNumber(amount));
        if (fiatValue) {
            setValue('fiat', fiatValue.toFixed(baseCurrencyDecimals));
        }
    };

    const symbol = getNetworkDisplaySymbol(account.symbol);

    const renderFiatSuffix = (fiatValue: typeof higherFiatValue) =>
        fiatValue ? (
            <Text color="contentCritical" variant="body-sm-strong">
                {' ('}
                <BaseCurrencyAmountFormatter
                    value={fiatValue}
                    symbol={account.symbol}
                    color="contentCritical"
                    variant="body-sm-strong"
                    isDiscreetText={false}
                />
                )
            </Text>
        ) : (
            ''
        );

    return (
        <InlineAlertBox
            intent="critical"
            title={
                <Translation
                    id={
                        bounds.closestLower
                            ? 'earn.unstakeFormScreen.validation.invalidUnstakeAmount'
                            : 'earn.unstakeFormScreen.validation.invalidUnstakeAmountHigherOnly'
                    }
                    values={{
                        higher: (
                            <Link
                                label={`${bounds.closestHigher} ${symbol}`}
                                onPress={() => handleSelectAmount(bounds.closestHigher)}
                                isUnderlined
                                textVariant="body-sm-strong"
                                textColor="contentCritical"
                                textPressedColor="contentCritical"
                            />
                        ),
                        higherFiat: renderFiatSuffix(higherFiatValue),
                        lower: bounds.closestLower ? (
                            <Link
                                label={`${bounds.closestLower} ${symbol}`}
                                onPress={() => handleSelectAmount(bounds.closestLower!)}
                                isUnderlined
                                textVariant="body-sm-strong"
                                textColor="contentCritical"
                                textPressedColor="contentCritical"
                            />
                        ) : undefined,
                        lowerFiat: bounds.closestLower
                            ? renderFiatSuffix(lowerFiatValue)
                            : undefined,
                    }}
                />
            }
        />
    );
};
