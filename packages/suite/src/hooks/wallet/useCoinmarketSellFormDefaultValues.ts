import { useMemo } from 'react';
import regional from 'src/constants/wallet/coinmarket/regional';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { buildOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { SellFormState } from 'src/types/wallet/coinmarketSellForm';

export const useCoinmarketSellFormDefaultValues = (
    symbol: Account['symbol'],
    sellInfo?: SellInfo,
    defaultAddress?: string,
) => {
    const country = sellInfo?.sellList?.country || regional.unknownCountry;
    const defaultCountry = useMemo(
        () => ({
            label: regional.countriesMap.get(country),
            value: country,
        }),
        [country],
    );
    const defaultCurrency = useMemo(() => ({ label: 'EUR', value: 'eur' }), []);
    const defaultValues = useMemo(
        () =>
            sellInfo
                ? ({
                      ...DEFAULT_VALUES,
                      feePerUnit: '',
                      feeLimit: '',
                      estimatedFeeLimit: undefined,
                      fiatInput: '',
                      fiatCurrencySelect: defaultCurrency,
                      cryptoInput: '',
                      cryptoCurrencySelect: buildOption(symbol),
                      countrySelect: defaultCountry,
                      options: ['broadcast'],
                      outputs: [
                          {
                              ...DEFAULT_PAYMENT,
                              address: defaultAddress,
                          },
                      ],
                      // TODO: remove type casting (options string[])
                  } as SellFormState)
                : undefined,
        [symbol, defaultCountry, defaultCurrency, sellInfo, defaultAddress],
    );
    return { defaultCountry, defaultCurrency, defaultValues };
};
