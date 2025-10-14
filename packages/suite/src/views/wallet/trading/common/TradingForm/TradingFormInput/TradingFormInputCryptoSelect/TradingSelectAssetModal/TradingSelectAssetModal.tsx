import { useCallback, useMemo } from 'react';

import { CryptoId } from 'invity-api';

import {
    CRYPTO_PLATFORM_SEPARATOR,
    TOKEN_SELECT_SELECTABLE_NETWORKS,
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TradingCryptoSelectItemProps,
    TradingCryptoSelectOptionProps,
    isCryptoIdForNativeToken,
    tradingActions,
} from '@suite-common/trading';
import {
    AssetOptionBaseProps,
    AssetProps,
    ITEM_HEIGHT,
    NetworkTabs,
    SearchAsset,
    SelectAssetModal,
} from '@trezor/product-components';

import { Translation } from 'src/components/suite/Translation';
import { TokenBalance } from 'src/components/wallet/TokenBalance';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    SelectAssetOptionCurrencyProps,
    TradingTradeBuyExchangeType,
} from 'src/types/trading/trading';
import { getFingerprint } from 'src/utils/wallet/getFingerprint';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import { useBuildOptions } from './hooks/useBuildOptions';
import { useNetworksCount } from './hooks/useNetworksCount';
import { useNetworksTabs } from './hooks/useNetworksTabs';
import { useOptionsSearch } from './hooks/useOptionsSearch';

const getCurrencyOptionsMappedToAssetProps = (
    options: SelectAssetOptionCurrencyProps[],
): AssetProps[] =>
    options.map(item => ({
        ticker: item.label ?? item.ticker,
        symbol: item.symbol,
        cryptoName: item.cryptoName ?? item.ticker,
        badge: item.badge ?? item.networkName,
        coingeckoId: item.coingeckoId,
        contractAddress: item.contractAddress,
        height: ITEM_HEIGHT,
        tokenBalance: item.tokenBalance,
    }));

export interface TradingSelectAssetModalProps {
    onModalClose: () => void;
    dataTestId?: string;
    sortTokensByFiatBalanceInDesc?: boolean;
    rawOptions: TradingCryptoSelectOptionProps[];
}

export function TradingSelectAssetModal({
    rawOptions,
    onModalClose,
    dataTestId,
    sortTokensByFiatBalanceInDesc = true,
}: TradingSelectAssetModalProps) {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const context = useTradingFormContext<TradingTradeBuyExchangeType>();

    const options = useBuildOptions(rawOptions, sortTokensByFiatBalanceInDesc);
    const networkCount = useNetworksCount(options);

    const { activeTab, setActiveTab, activeTabOptions } = useNetworksTabs(options);
    const { filteredOptions, setSearch, search } = useOptionsSearch(activeTabOptions);

    const assetOptions = useMemo(
        () => getCurrencyOptionsMappedToAssetProps(filteredOptions),
        [filteredOptions],
    );
    const optionsFingerprint = useMemo(
        () =>
            // Ignore `tokenBalance` to prevent unwanted scroll resets, we don't actually need realtime updates for these two fields.
            getFingerprint(assetOptions.map(({ tokenBalance, ...rest }) => rest)),
        [assetOptions],
    );

    const handleSelectChange = useCallback(
        (selectedAsset: AssetOptionBaseProps) => {
            const findOption = rawOptions.find(option => {
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
                context.setValue(TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, findOption, {
                    shouldDirty: true,
                });

                context.resetSelectedOffer();
            } else {
                context.setValue(TRADING_FORM_CRYPTO_CURRENCY_SELECT, findOption, {
                    shouldDirty: true,
                });
            }

            context.setAmountLimits(undefined);
            onModalClose();
            dispatch(tradingActions.setModalCryptoCurrency(findOption.value));
        },
        [context, dispatch, onModalClose, rawOptions],
    );

    return (
        <SelectAssetModal
            data-testid={dataTestId ?? '@trading/form/select-crypto'}
            options={assetOptions}
            optionsFingerprint={optionsFingerprint}
            onSelectAsset={handleSelectChange}
            onClose={onModalClose}
            searchInput={
                <SearchAsset
                    data-testid="@trading/form/select-crypto/search-input"
                    searchPlaceholder={
                        activeTab
                            ? translationString('TR_SELECT_ASSET_OF_NETWORK_PLACEHOLDER')
                            : translationString('TR_SELECT_ASSET_OF_NETWORKS_PLACEHOLDER')
                    }
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
                    tabs={TOKEN_SELECT_SELECTABLE_NETWORKS}
                    networkCount={networkCount}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            }
            renderOptionBalance={option =>
                option.tokenBalance && option.contractAddress ? (
                    <TokenBalance
                        contractAddress={option.contractAddress}
                        tokenBalance={option.tokenBalance}
                    />
                ) : null
            }
        />
    );
}
