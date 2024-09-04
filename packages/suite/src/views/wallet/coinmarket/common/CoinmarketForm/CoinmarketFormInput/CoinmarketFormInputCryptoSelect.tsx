import { Controller } from 'react-hook-form';
import { Select, useElevation } from '@trezor/components';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketOptionsGroupProps,
} from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';
import { useMemo, useState } from 'react';
import {
    CoinmarketFormOption,
    CoinmarketFormOptionGroupLabel,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
    CoinmarketFormOptionLogo,
    CoinmarketFormOptionNetwork,
} from 'src/views/wallet/coinmarket';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketFormInputCryptoSelectProps,
} from 'src/types/coinmarket/coinmarketForm';
import { createFilter } from 'react-select';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { cryptoIdToNetwork, parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { isCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CryptoId } from 'invity-api';

export const CoinmarketFormInputCryptoSelect = <
    TFieldValues extends CoinmarketBuyFormProps | CoinmarketExchangeFormProps,
>({
    label,
    cryptoSelectName,
    supportedCryptoCurrencies,
    methods,
    openMenuOnInput,
}: CoinmarketFormInputCryptoSelectProps<TFieldValues>) => {
    const context = useCoinmarketFormContext();
    const { buildCryptoOptions } = useCoinmarketInfo();
    const { elevation } = useElevation();
    const { control } = methods;

    const [isOpen, setIsOpen] = useState(false);
    const [isFocus, setIsFocus] = useState(false);
    const sendCryptoSelectValue = isCoinmarketExchangeOffers(context)
        ? (context.getValues()?.sendCryptoSelect?.value as CryptoId)
        : null;

    const options = useMemo(
        () =>
            buildCryptoOptions(
                supportedCryptoCurrencies ?? new Set(),
                sendCryptoSelectValue ? new Set([sendCryptoSelectValue]) : new Set(),
            ),
        [buildCryptoOptions, supportedCryptoCurrencies, sendCryptoSelectValue],
    );

    return (
        <>
            <CoinmarketFormInputLabel label={label} />
            <Controller
                name={cryptoSelectName}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={isFocus ? '' : value}
                        placeholder={<Translation id="TR_TRADE_ENTER_COIN" />}
                        options={options}
                        onInputChange={inputValue => {
                            setIsOpen(inputValue.length > 1);
                        }}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        menuIsOpen={openMenuOnInput ? isOpen : undefined}
                        onChange={(option, ref) => {
                            onChange(option);
                            ref?.blur();
                        }}
                        filterOption={createFilter<CoinmarketAccountOptionsGroupOptionProps>({
                            stringify: option => `${option.label} ${option.data.cryptoName}`,
                        })}
                        formatGroupLabel={group => {
                            const { translationId, networkName } =
                                group as CoinmarketOptionsGroupProps;

                            return (
                                <CoinmarketFormOptionGroupLabel>
                                    <Translation id={translationId} values={{ networkName }} />
                                </CoinmarketFormOptionGroupLabel>
                            );
                        }}
                        formatOptionLabel={(option: CoinmarketAccountOptionsGroupOptionProps) => {
                            const { networkId, contractAddress } = parseCryptoId(option.value);
                            const network = cryptoIdToNetwork(networkId);

                            return (
                                <CoinmarketFormOption>
                                    <CoinmarketFormOptionLogo cryptoId={option.value} size={20} />
                                    <CoinmarketFormOptionLabel>
                                        {option.label}
                                    </CoinmarketFormOptionLabel>
                                    <CoinmarketFormOptionLabelLong>
                                        {option.cryptoName}
                                    </CoinmarketFormOptionLabelLong>
                                    {contractAddress && (
                                        <CoinmarketFormOptionNetwork $elevation={elevation}>
                                            {network?.name}
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
