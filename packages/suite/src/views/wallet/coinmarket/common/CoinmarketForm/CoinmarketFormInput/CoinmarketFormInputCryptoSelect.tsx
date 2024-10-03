import { Controller } from 'react-hook-form';
import { Select, useElevation } from '@trezor/components';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketCryptoSelectItemProps,
    CoinmarketTradeBuyExchangeType,
} from 'src/types/coinmarket/coinmarket';
import { useMemo, useState } from 'react';
import {
    CoinmarketFormOption,
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
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { isCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { SelectAssetModal } from '@trezor/product-components';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/coinmarket/form';

export const CoinmarketFormInputCryptoSelect = <
    TFieldValues extends CoinmarketBuyFormProps | CoinmarketExchangeFormProps,
>({
    label,
    cryptoSelectName,
    supportedCryptoCurrencies,
    methods,
    isDisabled,
}: CoinmarketFormInputCryptoSelectProps<TFieldValues>) => {
    const context = useCoinmarketFormContext<CoinmarketTradeBuyExchangeType>();
    const { buildCryptoOptions, cryptoIdToPlatformName } = useCoinmarketInfo();
    const { elevation } = useElevation();
    const { control } = methods;
    const [isModalActive, setIsModalActive] = useState(false);

    const sendCryptoSelectValue = isCoinmarketExchangeOffers(context)
        ? context.getValues()?.sendCryptoSelect?.value
        : null;

    const options = useMemo(
        () =>
            buildCryptoOptions(
                supportedCryptoCurrencies ?? new Set(),
                sendCryptoSelectValue ? new Set([sendCryptoSelectValue]) : new Set(),
            ),
        [buildCryptoOptions, supportedCryptoCurrencies, sendCryptoSelectValue],
    );

    const handleSelectChange = (selectedCryptoId: string) => {
        const findOption = options.find(
            option => option.type === 'currency' && option.value === selectedCryptoId,
        ) as CoinmarketCryptoSelectItemProps | undefined;

        if (!findOption) return;

        if (isCoinmarketExchangeOffers(context)) {
            context.setValue(FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, findOption);
        } else {
            context.setValue(FORM_CRYPTO_CURRENCY_SELECT, findOption);
        }

        setIsModalActive(false);
    };

    const getNetworks = () => {
        const networksToSelect: NetworkSymbol[] = ['eth', 'sol', 'pol', 'bnb'];
        const networkAllKeys = Object.keys(networks) as NetworkSymbol[];
        const networkKeys = networkAllKeys.filter(item => networksToSelect.includes(item));
        const networksSelected = networkKeys.map(networkKey => ({
            name: networks[networkKey].name,
            symbol: networks[networkKey].symbol,
            coingeckoId: networks[networkKey].coingeckoId,
            coingeckoNativeId: networks[networkKey].coingeckoNativeId,
        }));

        return networksSelected;
    };

    return (
        <>
            <CoinmarketFormInputLabel label={label} />
            {isModalActive && (
                <SelectAssetModal
                    options={options}
                    networkCategories={getNetworks()}
                    onSelectAssetModal={handleSelectChange}
                    onClose={() => setIsModalActive(false)}
                />
            )}
            <Controller
                name={cryptoSelectName}
                control={control}
                render={({ field: { value } }) => (
                    <Select
                        value={value}
                        options={options}
                        onMenuOpen={() => setIsModalActive(true)}
                        formatOptionLabel={(option: CoinmarketAccountOptionsGroupOptionProps) => {
                            const { networkId, contractAddress } = parseCryptoId(option.value);
                            const platform = cryptoIdToPlatformName(networkId);

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
                                            {platform}
                                        </CoinmarketFormOptionNetwork>
                                    )}
                                </CoinmarketFormOption>
                            );
                        }}
                        data-testid="@coinmarket/form/select-crypto"
                        isClearable={false}
                        isMenuOpen={false}
                        isDisabled={isDisabled}
                    />
                )}
            />
        </>
    );
};
