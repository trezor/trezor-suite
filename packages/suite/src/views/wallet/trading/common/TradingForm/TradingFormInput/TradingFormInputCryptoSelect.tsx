import { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';

import { CryptoId } from 'invity-api';

import {
    CRYPTO_PLATFORM_SEPARATOR,
    TradingCryptoSelectItemProps,
    cryptoIdToNetwork,
    isCryptoIdForNativeToken,
    parseCryptoId,
    useTradingInfo,
} from '@suite-common/trading';
import { Network, NetworkSymbol, getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { Badge, Row, Select, Text } from '@trezor/components';
import {
    AssetOptionBaseProps,
    AssetProps,
    ITEM_HEIGHT,
    NetworkTabs,
    SearchAsset,
    SelectAssetModal,
} from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/trading/form';
import { useTranslation } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    SelectAssetOptionProps,
    TradingAccountOptionsGroupOptionProps,
    TradingTradeBuyExchangeType,
} from 'src/types/trading/trading';
import {
    TradingBuyFormProps,
    TradingExchangeFormProps,
    TradingFormInputCryptoSelectProps,
} from 'src/types/trading/tradingForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import { TradingCoinLogo } from '../../TradingCoinLogo';

const getNetworkCount = (options: SelectAssetOptionProps[]) => {
    const networkNetworkGroups = options
        .filter(item => item.type === 'group' && item.networkName)
        .map(networkGroup => ({
            ...networkGroup,
            tradeCryptoId: networkGroup.coingeckoId
                ? getNetworkByCoingeckoId(networkGroup.coingeckoId)?.tradeCryptoId
                : undefined,
        }));

    const networkCurrencies = options.filter(
        item =>
            item.type === 'currency' &&
            !item.contractAddress &&
            !networkNetworkGroups.find(
                group =>
                    group.coingeckoId === item.coingeckoId ||
                    group.tradeCryptoId === item.coingeckoId,
            ),
    );

    return networkNetworkGroups.length + networkCurrencies.length;
};

const getData = (options: SelectAssetOptionProps[]): AssetProps[] =>
    options
        .filter(item => item.type === 'currency')
        .map(item => ({
            ticker: item.label ?? item.ticker,
            symbol: item.symbol,
            cryptoName: item.cryptoName ?? item.ticker,
            badge: item.badge ?? item.networkName,
            coingeckoId: item.coingeckoId,
            contractAddress: item.contractAddress,
            height: ITEM_HEIGHT,
        }));

export const TradingFormInputCryptoSelect = <
    TFieldValues extends TradingBuyFormProps | TradingExchangeFormProps,
>({
    label,
    cryptoSelectName,
    supportedCryptoCurrencies,
    methods,
    isDisabled,
    'data-testid': dataTestId,
}: TradingFormInputCryptoSelectProps<TFieldValues>) => {
    const context = useTradingFormContext<TradingTradeBuyExchangeType>();
    const { buildCryptoOptions, cryptoIdToPlatformName } = useTradingInfo(context.type);
    const { control } = methods;
    const [isModalActive, setIsModalActive] = useState(false);
    const [activeTab, setActiveTab] = useState<Network | null>(null);
    const [search, setSearch] = useState('');
    const { translationString } = useTranslation();

    const sendCryptoSelectValue = isTradingExchangeContext(context)
        ? context.getValues()?.sendCryptoSelect?.value
        : null;

    const formOptions = useMemo(
        () =>
            buildCryptoOptions(
                supportedCryptoCurrencies ?? new Set(),
                sendCryptoSelectValue ? new Set([sendCryptoSelectValue]) : new Set(),
            ),
        [buildCryptoOptions, sendCryptoSelectValue, supportedCryptoCurrencies],
    );

    const modalOptions: SelectAssetOptionProps[] = useMemo(
        () =>
            formOptions
                .map(option => {
                    if (option.type !== 'currency') return option; // label

                    const network = cryptoIdToNetwork(option.value);

                    if (!network) return null;

                    const { symbol } = network;

                    return {
                        ...option,
                        ticker: option.ticker || option.label,
                        symbol,
                        contractAddress: option.contractAddress ?? null,
                        coingeckoId: option.coingeckoId,
                    };
                })
                .filter(option => option !== null),
        [formOptions],
    );

    const handleSelectChange = (selectedAsset: AssetOptionBaseProps) => {
        const findOption = formOptions.find(option => {
            const { coingeckoId, contractAddress } = selectedAsset;
            const isNativeTokenSymbol = isCryptoIdForNativeToken(coingeckoId as CryptoId);
            const tokenCryptoId = isNativeTokenSymbol
                ? coingeckoId
                : `${coingeckoId}${CRYPTO_PLATFORM_SEPARATOR}${contractAddress}`;

            const cryptoId = contractAddress ? tokenCryptoId : coingeckoId;

            return option.type === 'currency' && option.value === cryptoId;
        }) as TradingCryptoSelectItemProps | undefined;

        if (!findOption) return;

        if (isTradingExchangeContext(context)) {
            context.setValue(FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, findOption, {
                shouldDirty: true,
            });
        } else {
            context.setValue(FORM_CRYPTO_CURRENCY_SELECT, findOption, { shouldDirty: true });
        }

        context.setAmountLimits(undefined);
        setIsModalActive(false);
    };

    const data = useMemo(() => getData(modalOptions), [modalOptions]);

    const filteredData = data.filter(item => {
        if (
            activeTab &&
            item.coingeckoId !== activeTab.coingeckoId &&
            item.symbol !== activeTab.symbol
        ) {
            return false;
        }

        const contractAddress = item.contractAddress || undefined;
        const searchFor = (property?: string) =>
            property?.toLocaleLowerCase().includes(search.toLocaleLowerCase());

        return (
            searchFor(item.cryptoName) ||
            (typeof item.badge === 'string' && searchFor(item.badge)) ||
            searchFor(item.ticker) ||
            searchFor(contractAddress) ||
            searchFor(item.symbol)
        );
    });

    const quickTabs: NetworkSymbol[] = ['eth', 'sol', 'pol', 'bsc', 'base', 'op', 'arb'];

    return (
        <>
            {isModalActive && (
                <SelectAssetModal
                    data-testid={dataTestId ?? '@trading/form/select-crypto'}
                    options={filteredData}
                    onSelectAsset={handleSelectChange}
                    onClose={() => setIsModalActive(false)}
                    searchInput={
                        <SearchAsset
                            data-testid="@trading/form/select-crypto/search-input"
                            searchPlaceholder={translationString('TR_SELECT_NAME_OR_ADDRESS')}
                            search={search}
                            setSearch={setSearch}
                        />
                    }
                    noItemsAvailablePlaceholder={{
                        heading: (
                            <Translation
                                id="TR_TOKEN_NOT_FOUND_ON_NETWORK"
                                values={{
                                    networkName: activeTab?.name ?? '',
                                }}
                            />
                        ),
                        body: <Translation id="TR_TOKEN_TRY_DIFFERENT_SEARCH_OR_SWITCH" />,
                    }}
                    filterTabs={
                        <NetworkTabs
                            data-testid="@trading/form/select-crypto/network-tab"
                            tabs={quickTabs}
                            networkCount={getNetworkCount(modalOptions)}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    }
                />
            )}
            {/* TODO: Select not needed  */}
            <Controller
                name={cryptoSelectName}
                control={control}
                render={({ field: { value } }) => (
                    <Select
                        value={value}
                        options={formOptions}
                        labelLeft={label && <Translation id={label} />}
                        onMenuOpen={() => setIsModalActive(true)}
                        formatOptionLabel={(option: TradingAccountOptionsGroupOptionProps) => {
                            const { networkId, contractAddress } = parseCryptoId(option.value);
                            const platform = cryptoIdToPlatformName(networkId);

                            return (
                                <Row gap={spacings.sm}>
                                    <TradingCoinLogo cryptoId={option.value} size={20} />
                                    <Text>{option.label}</Text>
                                    <Text variant="tertiary" typographyStyle="label">
                                        {option.cryptoName}
                                    </Text>
                                    {contractAddress && <Badge size="small">{platform}</Badge>}
                                </Row>
                            );
                        }}
                        data-testid={dataTestId ?? '@trading/form/select-crypto'}
                        isClearable={false}
                        isMenuOpen={false}
                        isDisabled={isDisabled}
                    />
                )}
            />
        </>
    );
};
