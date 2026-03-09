import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount, getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { HStack, Switch, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { EarnFormValues } from '../earnFormSchema';

type EarnMaxButtonProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    isChecked: boolean;
    onChange: (value: boolean) => void;
};

export const EarnMaxButton = ({ accountKey, symbol, isChecked, onChange }: EarnMaxButtonProps) => {
    const { setValue } = useFormContext<EarnFormValues>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const converters = useCryptoFiatConverters({ symbol });

    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrencyCode,
        isInSats: isBaseCurrencyInSats,
    });

    const handleChange = (value: boolean) => {
        onChange(value);

        if (value && account) {
            const maxAmount = formatNetworkAmount(account.availableBalance, symbol);
            setValue('amount', maxAmount, { shouldValidate: true });

            const fiatValue = converters?.convertCryptoToFiat?.(new BigNumber(maxAmount));
            if (fiatValue) {
                setValue('fiat', fiatValue.toFixed(baseCurrencyDecimals));
            }
        } else {
            setValue('amount', '', { shouldValidate: false });
            setValue('fiat', '');
        }
    };

    return (
        <HStack alignItems="center" spacing="sp8">
            <Text variant="body-sm">
                <Translation id="earn.earnFormScreen.stakeMaxButton" />
            </Text>
            <Switch isChecked={isChecked} onChange={handleChange} />
        </HStack>
    );
};
