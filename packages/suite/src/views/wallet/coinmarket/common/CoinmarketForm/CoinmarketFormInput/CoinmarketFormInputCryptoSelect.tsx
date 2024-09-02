import { useSelector } from 'src/hooks/suite';
import {
    cryptoToNetworkSymbol,
    isCryptoSymbolToken,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { Controller } from 'react-hook-form';
import { Select, useElevation } from '@trezor/components';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketOptionsGroupProps,
} from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';
import { networks } from '@suite-common/wallet-config';
import { useMemo } from 'react';
import { coinmarketBuildCryptoOptions } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormOptionIcon } from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';
import {
    CoinmarketFormOption,
    CoinmarketFormOptionGroupLabel,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
    CoinmarketFormOptionNetwork,
} from 'src/views/wallet/coinmarket';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketFormInputCryptoSelectProps,
} from 'src/types/coinmarket/coinmarketForm';
import { createFilter } from 'react-select';
import CryptoCategories from 'src/constants/wallet/coinmarket/cryptoCategories';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { isCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';

export const CoinmarketFormInputCryptoSelect = <
    TFieldValues extends CoinmarketBuyFormProps | CoinmarketExchangeFormProps,
>({
    label,
    cryptoSelectName,
    supportedCryptoCurrencies,
    methods,
}: CoinmarketFormInputCryptoSelectProps<TFieldValues>) => {
    const context = useCoinmarketFormContext();
    const { elevation } = useElevation();
    const { control } = methods;
    const { symbolsInfo } = useSelector(state => state.wallet.coinmarket.info);

    const options = useMemo(
        () =>
            coinmarketBuildCryptoOptions({
                symbolsInfo,
                cryptoCurrencies: supportedCryptoCurrencies ?? new Set(),
                excludeAccountSymbol: isCoinmarketExchangeOffers(context)
                    ? context.account.symbol
                    : undefined,
            }),

        [context, supportedCryptoCurrencies, symbolsInfo],
    );

    return (
        <>
            <CoinmarketFormInputLabel label={label} />
            <Controller
                name={cryptoSelectName}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={options}
                        onChange={onChange}
                        filterOption={createFilter<CoinmarketAccountOptionsGroupOptionProps>({
                            stringify: option => `${option.value} ${option.data.cryptoName}`,
                        })}
                        formatGroupLabel={group => {
                            const translationId =
                                CryptoCategories[(group as CoinmarketOptionsGroupProps).label]
                                    ?.translationId;

                            return (
                                <CoinmarketFormOptionGroupLabel>
                                    {translationId && <Translation id={translationId} />}
                                </CoinmarketFormOptionGroupLabel>
                            );
                        }}
                        formatOptionLabel={(option: CoinmarketAccountOptionsGroupOptionProps) => {
                            const networkSymbol = cryptoToNetworkSymbol(option.value);

                            return (
                                <CoinmarketFormOption>
                                    <CoinmarketFormOptionIcon symbol={option.label} />
                                    <CoinmarketFormOptionLabel>
                                        {option.label}
                                    </CoinmarketFormOptionLabel>
                                    <CoinmarketFormOptionLabelLong>
                                        {option.cryptoName}
                                    </CoinmarketFormOptionLabelLong>
                                    <CoinmarketFormOptionLabelLong>
                                        ({option.label})
                                    </CoinmarketFormOptionLabelLong>
                                    {option.value &&
                                        isCryptoSymbolToken(option.value) &&
                                        networkSymbol && (
                                            <CoinmarketFormOptionNetwork $elevation={elevation}>
                                                {networks[networkSymbol].name}
                                            </CoinmarketFormOptionNetwork>
                                        )}
                                </CoinmarketFormOption>
                            );
                        }}
                        data-testid="@coinmarket/form/select-crypto"
                        isClearable={false}
                        isSearchable
                    />
                )}
            />
        </>
    );
};
