import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type StakeRootState,
    getMaxStakeAmount,
    selectAccountByKey,
    selectBaseCurrency,
    selectIsBaseCurrencyInSats,
    selectStakedBalanceByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey, type StakeType } from '@suite-common/wallet-types';
import { formatNetworkAmount, getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { HStack, Switch, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { BigNumber } from '@trezor/utils';

import { type EarnFormValues } from '../../utils/earn/earnFormSchema';

export type EarnMaxButtonVariant = Extract<StakeType, 'stake' | 'unstake'>;

type EarnMaxButtonProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    isChecked: boolean;
    onChange: (value: boolean) => void;
    variant?: EarnMaxButtonVariant;
};

export const EarnMaxButton = ({
    accountKey,
    symbol,
    isChecked,
    onChange,
    variant = 'stake',
}: EarnMaxButtonProps) => {
    const { setValue } = useFormContext<EarnFormValues>();
    const { analytics } = useServices(injectNativeAnalytics);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const stakedBalance = useSelector((state: StakeRootState) =>
        selectStakedBalanceByAccountKey(state, accountKey),
    );
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const converters = useCryptoFiatConverters({ symbol });

    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrencyCode,
        isInSats: isBaseCurrencyInSats,
    });

    const getMaxAmount = (): string => {
        if (variant === 'unstake') {
            return stakedBalance ?? '0';
        }

        const availableAmount = formatNetworkAmount(account!.availableBalance, symbol);

        return getMaxStakeAmount({ balance: availableAmount, symbol });
    };

    const setMaxAmount = () => {
        if (!account) return;

        const maxAmount = getMaxAmount();

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
            setValue('fiat', '', { shouldValidate: false });

            return;
        }

        if (variant === 'stake') {
            analytics.report({
                type: events.appFormPercentButtonsEvent.name,
                payload: { type: 'staking', value: 'max' },
            });
        }

        setMaxAmount();
    };

    return (
        <HStack alignItems="center" spacing="sp8">
            <Text variant="body-sm">
                {variant === 'unstake' ? (
                    <Translation id="earn.earnFormScreen.unstakeMaxButton" />
                ) : (
                    <Translation id="earn.earnFormScreen.stakeMaxButton" />
                )}
            </Text>
            <Switch isChecked={isChecked} onChange={handleChange} />
        </HStack>
    );
};
