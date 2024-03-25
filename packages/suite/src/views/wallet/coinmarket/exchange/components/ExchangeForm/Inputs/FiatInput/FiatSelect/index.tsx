import { Select } from '@trezor/components';
import { Controller } from 'react-hook-form';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { FIAT_CURRENCY } from 'src/types/wallet/coinmarketExchangeForm';
import { buildCurrencyOptions } from '@suite-common/wallet-utils';
import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { useDispatch } from 'src/hooks/suite';
import { FiatCurrencyCode } from '@suite-common/suite-config';

const FiatSelect = () => {
    const { account, control, setAmountLimits, getValues, updateFiatCurrency, defaultCurrency } =
        useCoinmarketExchangeFormContext();

    const dispatch = useDispatch();

    const { outputs } = getValues();

    const token = outputs?.[0]?.token;

    return (
        <Controller
            control={control}
            name={FIAT_CURRENCY}
            defaultValue={defaultCurrency}
            render={({ field: { onChange, value } }) => (
                <Select
                    onChange={async (selected: any) => {
                        onChange(selected);
                        const updateFiatRatesResult = await dispatch(
                            updateFiatRatesThunk({
                                ticker: {
                                    symbol: account.symbol as NetworkSymbol,
                                    tokenAddress: token as TokenAddress,
                                },
                                localCurrency: selected.value as FiatCurrencyCode,
                                rateType: 'current',
                                fetchAttemptTimestamp: Date.now() as Timestamp,
                            }),
                        );
                        if (updateFiatRatesResult.meta.requestStatus === 'fulfilled') {
                            const rate = updateFiatRatesResult.payload as number;

                            updateFiatCurrency(selected, rate);
                        }
                        setAmountLimits(undefined);
                    }}
                    data-test="@coinmarket/exchange/fiat-select"
                    value={value}
                    isClearable={false}
                    options={buildCurrencyOptions(value)}
                    minValueWidth="58px"
                    isClean
                />
            )}
        />
    );
};

export default FiatSelect;
