import { Controller } from 'react-hook-form';
import { useMemo, useState } from 'react';

import { Select, Row, Badge, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import { SelectAssetModal } from '@trezor/product-components';

import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketCryptoSelectItemProps,
    CoinmarketTradeBuyExchangeType,
} from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketFormInputCryptoSelectProps,
} from 'src/types/coinmarket/coinmarketForm';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/coinmarket/form';
import { isCoinmarketExchangeContext } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';

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
    const { control } = methods;
    const [isModalActive, setIsModalActive] = useState(false);

    const sendCryptoSelectValue = isCoinmarketExchangeContext(context)
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

        if (isCoinmarketExchangeContext(context)) {
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
                        labelLeft={label && <Translation id={label} />}
                        onMenuOpen={() => setIsModalActive(true)}
                        formatOptionLabel={(option: CoinmarketAccountOptionsGroupOptionProps) => {
                            const { networkId, contractAddress } = parseCryptoId(option.value);
                            const platform = cryptoIdToPlatformName(networkId);

                            return (
                                <Row gap={spacings.sm}>
                                    <CoinmarketCoinLogo cryptoId={option.value} size={20} />
                                    <Text>{option.label}</Text>
                                    <Text variant="tertiary" typographyStyle="label">
                                        {option.cryptoName}
                                    </Text>
                                    {contractAddress && <Badge size="small">{platform}</Badge>}
                                </Row>
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
