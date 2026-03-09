import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getDecimalsForBaseCurrency,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { HStack, Switch, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { type EarnFormValues } from '../earnFormSchema';

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

    const setMaxStakeAmount = () => {
        if (!account) return;

        const limits = getStakingLimitsByNetworkSymbol(symbol);
        const availableAmount = formatNetworkAmount(account.availableBalance, symbol);
        const buffer = limits?.MIN_BALANCE_FOR_FEE_BUFFER ?? 0;
        const maxAmount = BigNumber.max(new BigNumber(availableAmount).minus(buffer), 0).toFixed();

        setValue('amount', maxAmount, { shouldValidate: true });

        const fiatValue = converters?.convertCryptoToFiat?.(new BigNumber(maxAmount));
        if (fiatValue) {
            setValue('fiat', fiatValue.toFixed(baseCurrencyDecimals));
        }
    };

    const handleChange = (value: boolean) => {
        onChange(value);

        if (!value || !account) {
            setValue('amount', '', { shouldValidate: false });
            setValue('fiat', '');

            return;
        }

        setMaxStakeAmount();
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
