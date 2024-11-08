import { useMemo, useEffect, useState } from 'react';

import styled from 'styled-components';

import { AssetLogo, Column, Row, Text, Card, IconButton } from '@trezor/components';
import { selectCurrentFiatRates, updateFiatRatesThunk } from '@suite-common/wallet-core';
import { Account, Timestamp, TokenAddress } from '@suite-common/wallet-types';
import {
    CoinLogo,
    SearchAsset,
    SelectAssetModal,
    TokenTabs,
    TokenTab,
    AssetProps,
    ITEM_HEIGHT,
    AssetOptionBaseProps,
} from '@trezor/product-components';
import {
    getContractAddressForNetwork,
    getTokenExplorerUrl,
    hasNetworkFeatures,
    isNftToken,
} from '@suite-common/wallet-utils';
import { spacings } from '@trezor/theme';
import {
    selectCoinDefinitions,
    selectIsSpecificCoinDefinitionKnown,
    TokenDefinitions,
} from '@suite-common/token-definitions';
import { getCoingeckoId, networks, NetworkSymbol } from '@suite-common/wallet-config';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { TokenInfo } from '@trezor/blockchain-link-types';

import { selectIsCopyAddressModalShown } from 'src/reducers/suite/suiteReducer';
import {
    FiatValue,
    FormattedCryptoAmount,
    HiddenPlaceholder,
    Translation,
} from 'src/components/suite';
import { SUITE } from 'src/actions/suite/constants';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { TokenAddressRow } from 'src/components/suite/copy/TokenAddressRow';
import { copyAddressToClipboard, showCopyAddressModal } from 'src/actions/suite/copyAddressActions';

export const IconCursorWrapper = styled.div`
    cursor: pointer;
`;

const createTokenOption = (
    token: TokenInfo,
    symbol: Account['symbol'],
    shouldTryToFetch: boolean,
) => ({
    symbol: token.symbol ?? '',
    networkSymbol: symbol,
    cryptoName: token.name,
    badge: shouldTryToFetch ? undefined : <Translation id="TR_UNRECOGNIZED" />,
    coingeckoId: getCoingeckoId(symbol) ?? '',
    contractAddress: token.contract,
    shouldTryToFetch,
    height: ITEM_HEIGHT,
});

const buildTokenOptions = (
    accountTokens: Account['tokens'],
    symbol: Account['symbol'],
    coinDefinitions: TokenDefinitions['coin'],
    activeTokenTab: TokenTab['tab'],
) => {
    const result: AssetProps[] = [];

    if (activeTokenTab === 'tokens') {
        // this represents native currency
        result.push({
            symbol,
            networkSymbol: symbol,
            cryptoName: networks[symbol].name,
            badge: undefined,
            contractAddress: null,
            height: ITEM_HEIGHT,
        });
    }

    if (accountTokens) {
        const tokens = getTokens(accountTokens, symbol, coinDefinitions);

        if (accountTokens && activeTokenTab === 'tokens') {
            tokens.shownWithBalance.forEach(token =>
                result.push(createTokenOption(token, symbol, true)),
            );
        }

        if (accountTokens && activeTokenTab === 'hidden') {
            tokens.hiddenWithBalance.forEach(token =>
                result.push(createTokenOption(token, symbol, true)),
            );

            tokens.unverifiedWithBalance.forEach(token =>
                result.push(createTokenOption(token, symbol, false)),
            );
        }
    }

    return result;
};

type TokenSelectProps = {
    outputId: number;
};

export const TokenSelect = ({ outputId }: TokenSelectProps) => {
    const {
        account,
        clearErrors,
        setAmount,
        getValues,
        getDefaultValue,
        toggleOption,
        composeTransaction,
        watch,
        setValue,
        setDraftSaveRequest,
    } = useSendFormContext();

    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const [search, setSearch] = useState('');
    const [activeTokenTab, setActiveTokenTab] = useState<TokenTab['tab']>('tokens');
    const [isTokensModalActive, setIsTokensModalActive] = useState(false);

    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));
    const sendFormPrefill = useSelector(state => state.suite.prefillFields.sendForm);

    const tokenInputName = `outputs.${outputId}.token` as const;
    const amountInputName = `outputs.${outputId}.amount` as const;
    const currencyInputName = `outputs.${outputId}.currency` as const;
    const tokenContractAddress = watch(tokenInputName);

    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(
            state,
            account.symbol,
            (tokenContractAddress || '') as TokenAddress,
        ),
    );

    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');

    // Amount needs to be re-validated again AFTER token change propagation (decimal places, available balance)
    // watch token change and use "useSendFormFields.setAmount" util for validation (if amount is set)
    // if Amount is not valid 'react-hook-form' will set an error to it, and composeTransaction will be prevented
    // N0TE: do this conditionally only for networks with tokens and when set-max is not enabled
    const tokenWatch = watch(tokenInputName, null);
    const currencyValue = watch(currencyInputName);

    useEffect(() => {
        if (hasNetworkFeatures(account, 'tokens') && !isSetMaxActive) {
            const amountValue = getValues(`outputs.${outputId}.amount`) as string;
            if (amountValue) setAmount(outputId, amountValue);
        }
    }, [account, outputId, tokenWatch, setAmount, getValues, isSetMaxActive]);

    useEffect(() => {
        if (sendFormPrefill) {
            setValue(tokenInputName, sendFormPrefill, { shouldValidate: true, shouldDirty: true });
            setDraftSaveRequest(true);
            dispatch({
                type: SUITE.SET_SEND_FORM_PREFILL,
                payload: '',
            });
        }
    }, [sendFormPrefill, setValue, tokenInputName, setDraftSaveRequest, dispatch]);

    const tokensWithRates = enhanceTokensWithRates(
        account.tokens,
        localCurrency,
        account.symbol,
        fiatRates,
    );
    const sortedTokens = useMemo(
        () => tokensWithRates.sort(sortTokensWithRates),
        [tokensWithRates],
    );
    const options = buildTokenOptions(
        sortedTokens,
        account.symbol,
        coinDefinitions,
        activeTokenTab,
    );
    const filteredOptionsBySearch = options.filter(item => {
        if (!search) {
            return true;
        }

        const contractAddress = item.contractAddress || undefined;
        const searchFor = (property: string | undefined) =>
            property?.toLocaleLowerCase().includes(search.toLocaleLowerCase());

        return searchFor(item.cryptoName) || searchFor(item.symbol) || searchFor(contractAddress);
    });

    const selectedToken = account.tokens?.find(token => token.contract === tokenContractAddress);

    const handleSelectChange = async (selectedAsset: AssetOptionBaseProps) => {
        const newlySelectedToken = account.tokens?.find(
            token => token.contract === selectedAsset.contractAddress,
        );

        setValue(tokenInputName, newlySelectedToken?.contract || account.symbol, {
            shouldDirty: true,
        });

        setIsTokensModalActive(false);

        await dispatch(
            updateFiatRatesThunk({
                tickers: [
                    {
                        symbol: account.symbol as NetworkSymbol,
                        tokenAddress: (newlySelectedToken?.contract || '') as TokenAddress,
                    },
                ],
                localCurrency: currencyValue.value as FiatCurrencyCode,
                rateType: 'current',
                fetchAttemptTimestamp: Date.now() as Timestamp,
            }),
        );
        // clear errors in Amount input
        clearErrors(amountInputName);
        // remove Amount if isSetMaxActive or ETH data options are enabled
        if (isSetMaxActive || dataEnabled) setAmount(outputId, '');
        // remove ETH data option
        if (dataEnabled) toggleOption('ethereumData');
        // compose (could be prevented because of Amount error from re-validation above)
        composeTransaction(amountInputName);
    };

    const hasNoStandardTokens = !account.tokens?.filter(token => !isNftToken(token))?.length;
    const onCloseSelectAssetModal = () => setIsTokensModalActive(false);
    const onOpenSelectAssetModal = !hasNoStandardTokens
        ? () => setIsTokensModalActive(true)
        : undefined;

    const networkTokenContractAddress =
        selectedToken && getContractAddressForNetwork(account.symbol, selectedToken.contract);

    return (
        <>
            {isTokensModalActive && (
                <SelectAssetModal
                    options={filteredOptionsBySearch}
                    onSelectAsset={handleSelectChange}
                    onClose={onCloseSelectAssetModal}
                    searchInput={
                        <SearchAsset
                            searchPlaceholder={translationString(
                                'TR_SEARCH_TOKEN_IN_SEND_FORM_MODAL',
                            )}
                            search={search}
                            setSearch={setSearch}
                        />
                    }
                    noItemsAvailablePlaceholder={{
                        heading: <Translation id="TR_TOKEN_NOT_FOUND" />,
                        body: search ? (
                            <Translation id="TR_TOKEN_TRY_DIFFERENT_SEARCH" />
                        ) : undefined,
                    }}
                    filterTabs={
                        <TokenTabs
                            tabs={[
                                {
                                    tab: 'tokens',
                                    label: <Translation id="TR_TOKENS" />,
                                },
                                {
                                    tab: 'hidden',
                                    label: <Translation id="TR_HIDDEN" />,
                                },
                            ]}
                            activeTokenTab={activeTokenTab}
                            setActiveTokenTab={setActiveTokenTab}
                        />
                    }
                />
            )}

            <Card
                fillType="default"
                margin={{ bottom: spacings.sm }}
                paddingType="normal"
                onClick={onOpenSelectAssetModal}
            >
                <Row justifyContent="space-between" height={64}>
                    <Row justifyContent="flex-start" gap={spacings.sm}>
                        {networkTokenContractAddress ? (
                            <AssetLogo
                                coingeckoId={getCoingeckoId(account.symbol)!}
                                contractAddress={networkTokenContractAddress}
                                size={24}
                                placeholder={(
                                    selectedToken?.symbol || account.symbol
                                ).toUpperCase()}
                                placeholderWithTooltip={false}
                                shouldTryToFetch={isTokenKnown}
                            />
                        ) : (
                            <CoinLogo symbol={account.symbol} size={24} />
                        )}
                        <Column alignItems="flex-start">
                            <Row justifyContent="flex-start">
                                <Text variant="default" typographyStyle="body">
                                    {selectedToken?.name || networks[account.symbol].name}
                                </Text>
                            </Row>
                            <Row>
                                <Text variant="tertiary" typographyStyle="hint">
                                    <HiddenPlaceholder>
                                        <FormattedCryptoAmount
                                            value={
                                                selectedToken?.balance || account.formattedBalance
                                            }
                                            symbol={selectedToken?.symbol || account.symbol}
                                        />
                                    </HiddenPlaceholder>{' '}
                                    <FiatValue
                                        tokenAddress={selectedToken?.contract as TokenAddress}
                                        amount={selectedToken?.balance || account.formattedBalance}
                                        symbol={account.symbol}
                                        showApproximationIndicator
                                    />
                                </Text>
                            </Row>
                            {networkTokenContractAddress && (
                                <Row justifyContent="flex-start">
                                    <Text variant="tertiary" typographyStyle="hint">
                                        <Row gap={spacings.xxs}>
                                            {account.networkType === 'cardano' ? (
                                                <Translation id="TR_POLICY_ID_ADDRESS" />
                                            ) : (
                                                <Translation id="TR_CONTRACT_ADDRESS" />
                                            )}
                                            <TokenAddressRow
                                                typographyStyle="hint"
                                                variant="tertiary"
                                                tokenContractAddress={networkTokenContractAddress}
                                                shouldAllowCopy={true}
                                                tokenExplorerUrl={getTokenExplorerUrl(
                                                    networks[account.symbol],
                                                    selectedToken,
                                                )}
                                                onCopy={() =>
                                                    dispatch(
                                                        shouldShowCopyAddressModal
                                                            ? showCopyAddressModal(
                                                                  networkTokenContractAddress,
                                                                  'contract',
                                                              )
                                                            : copyAddressToClipboard(
                                                                  networkTokenContractAddress,
                                                              ),
                                                    )
                                                }
                                            />
                                        </Row>
                                    </Text>
                                </Row>
                            )}
                        </Column>
                    </Row>

                    {!hasNoStandardTokens && (
                        <IconButton icon="chevronDown" variant="tertiary" size="medium" />
                    )}
                </Row>
            </Card>
        </>
    );
};
