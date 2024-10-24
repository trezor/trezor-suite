import { useMemo, useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { AssetLogo, Column, Row, Select } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';
import { Account } from 'src/types/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { updateFiatRatesThunk, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { AddressType, Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { TokenDefinitions, selectCoinDefinitions } from '@suite-common/token-definitions';
import { SUITE } from 'src/actions/suite/constants';
import {
    CoinLogo,
    SelectAssetModal,
    SelectAssetOptionCurrencyProps,
} from '@trezor/product-components';
import { getCoingeckoId } from '@suite-common/wallet-config';
import { getContractAddressForNetwork } from '@suite-common/wallet-utils';
import { Card } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Text } from '@trezor/components';
import { CoinBalance, Translation } from 'src/components/suite';
import styled from 'styled-components';
import { TokenAddress as TokenAddressComponent } from './TokenAddress';
import { getTokenExplorerUrl } from '@suite-common/token-definitions';
import { openModal } from 'src/actions/suite/modalActions';
import { copyToClipboard } from '@trezor/dom-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectIsCopyAddressModalShown } from 'src/reducers/suite/suiteReducer';

export const buildTokenOptions = (
    accountTokens: Account['tokens'],
    symbol: Account['symbol'],
    coinDefinitions: TokenDefinitions['coin'],
    nativeTokenBalance: Account['formattedBalance'],
) => {
    // native token option
    const result: SelectAssetOptionCurrencyProps[] = [
        {
            type: 'currency',
            symbol,
            networkSymbol: symbol,
            coingeckoId: networks[symbol].coingeckoNativeId || '',
            contractAddress: null,
            cryptoName: networks[symbol].name,
            balance: nativeTokenBalance,
        },
    ];

    if (accountTokens) {
        const tokens = getTokens(accountTokens, symbol, coinDefinitions);

        tokens.shownWithBalance.forEach(token => {
            result.push({
                type: 'currency',
                symbol: token.symbol ?? symbol,
                networkSymbol: symbol,
                coingeckoId: getCoingeckoId(symbol) ?? '',
                contractAddress: token.contract,
                cryptoName: token.name,
                balance: token.balance,
                tokenExplorerUrl: getTokenExplorerUrl(networks[symbol], token),
            });
        });

        // Right now we dont want to show hidden or unverified tokens, left for the future use

        // if (tokens.hiddenWithBalance.length) {
        //     tokens.hiddenWithBalance.forEach(token => {
        //         result.push({
        //             type: 'currency',
        //             symbol: token.symbol ?? symbol,
        //             networkSymbol: symbol,
        //             hidden: true,
        //             coingeckoId: getCoingeckoId(symbol) ?? '',
        //             contractAddress: token.contract,
        //             cryptoName: token.name,
        //             balance: token.balance,
        //         });
        //     });
        // }

        // if (tokens.unverifiedWithBalance.length) {
        //     tokens.unverifiedWithBalance.forEach(token => {
        //         result.push({
        //             type: 'currency',
        //             unverified: true,
        //             symbol: token.symbol ?? symbol,
        //             networkSymbol: symbol,
        //             coingeckoId: getCoingeckoId(symbol) ?? '',
        //             contractAddress: token.contract,
        //             cryptoName: token.name,
        //             balance: token.balance,
        //         });
        //     });
        // }
    }

    return result;
};

interface TokenSelectProps {
    outputId: number;
}

const TokenSelectContainer = styled(Card)<{ $isDisabled: boolean }>`
    cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
`;

export const TokenSelect = ({ outputId }: TokenSelectProps) => {
    const {
        account,
        clearErrors,
        control,
        setAmount,
        getValues,
        getDefaultValue,
        toggleOption,
        composeTransaction,
        watch,
        setValue,
        setDraftSaveRequest,
    } = useSendFormContext();
    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);
    const [isTokensModalActive, setIsTokensModalActive] = useState(false);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));
    const sendFormPrefill = useSelector(state => state.suite.prefillFields.sendForm);
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const tokensWithRates = enhanceTokensWithRates(
        account.tokens,
        localCurrency,
        account.symbol,
        fiatRates,
    );
    const dispatch = useDispatch();

    const sortedTokens = useMemo(() => {
        return tokensWithRates.sort(sortTokensWithRates);
    }, [tokensWithRates]);

    const tokenInputName = `outputs.${outputId}.token` as const;
    const amountInputName = `outputs.${outputId}.amount` as const;
    const currencyInputName = `outputs.${outputId}.currency` as const;
    const tokenContractAddress = watch(tokenInputName);

    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');
    const options = buildTokenOptions(
        sortedTokens,
        account.symbol,
        coinDefinitions,
        account.formattedBalance,
    );

    // Amount needs to be re-validated again AFTER token change propagation (decimal places, available balance)
    // watch token change and use "useSendFormFields.setAmount" util for validation (if amount is set)
    // if Amount is not valid 'react-hook-form' will set an error to it, and composeTransaction will be prevented
    // N0TE: do this conditionally only for ETH and when set-max is not enabled
    const tokenWatch = watch(tokenInputName, null);
    const currencyValue = watch(currencyInputName);

    useEffect(() => {
        if (account.networkType === 'ethereum' && !isSetMaxActive) {
            const amountValue = getValues(`outputs.${outputId}.amount`) as string;
            if (amountValue) setAmount(outputId, amountValue);
        }
    }, [outputId, tokenWatch, setAmount, getValues, account.networkType, isSetMaxActive]);

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

    const findOption = options.find(option => {
        return option.type === 'currency' && option.contractAddress === tokenContractAddress;
    }) as SelectAssetOptionCurrencyProps | undefined;

    const selectedOption = findOption;

    const handleSelectChange = async (selectedAsset: SelectAssetOptionCurrencyProps) => {
        const selectedOption = options.find(
            option => option.contractAddress === selectedAsset.contractAddress,
        );
        if (!selectedOption) return;
        setValue(tokenInputName, selectedAsset.contractAddress);

        await dispatch(
            updateFiatRatesThunk({
                tickers: [
                    {
                        symbol: account.symbol as NetworkSymbol,
                        tokenAddress: selectedOption.contractAddress as TokenAddress,
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

        setIsTokensModalActive(false);
    };

    const onCopyAddress = (address: string, addressType: AddressType) => {
        if (shouldShowCopyAddressModal) {
            dispatch(
                openModal({
                    type: 'copy-address',
                    addressType,
                    address,
                }),
            );
        } else {
            const result = copyToClipboard(address);
            if (typeof result !== 'string') {
                dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
            }
        }
    };

    return (
        <>
            {isTokensModalActive && (
                <SelectAssetModal
                    options={options}
                    // networkCategories={getNetworks()}
                    onSelectAssetModal={handleSelectChange}
                    onClose={() => setIsTokensModalActive(false)}
                />
            )}
            <Controller
                control={control}
                name={tokenInputName}
                defaultValue={selectedOption?.contractAddress || null}
                data-testid={tokenInputName}
                render={({ field: { value } }) => (
                    <TokenSelectContainer
                        margin={{ bottom: spacings.sm }}
                        paddingType="normal"
                        onClick={
                            options.length > 1
                                ? () => {
                                      setIsTokensModalActive(true);
                                  }
                                : () => {}
                        }
                        $isDisabled={options.length === 1}
                    >
                        <Select
                            focusEnabled={false}
                            value={options.find(option => option.contractAddress === value)}
                            options={options.map(option => ({
                                value: option.contractAddress,
                                label: option.symbol,
                            }))}
                            isDisabled={options.length === 1}
                            formatOptionLabel={(option: SelectAssetOptionCurrencyProps) => {
                                return (
                                    <Row justifyContent="flex-start" gap={spacings.sm}>
                                        {findOption && findOption.contractAddress !== null ? (
                                            <>
                                                <AssetLogo
                                                    coingeckoId={findOption.coingeckoId || ''}
                                                    contractAddress={getContractAddressForNetwork(
                                                        option.networkSymbol as NetworkSymbol,
                                                        option.contractAddress ?? '',
                                                    )}
                                                    size={20}
                                                    placeholder={option.symbol}
                                                    placeholderWithTooltip={false}
                                                    shouldTryToFetch={true}
                                                />
                                            </>
                                        ) : (
                                            <CoinLogo symbol={account.symbol} size={20} />
                                        )}
                                        <Column alignItems="flex-start">
                                            <Row justifyContent="flex-start">
                                                <Text variant="default" typographyStyle="body">
                                                    {option.cryptoName}
                                                </Text>
                                            </Row>
                                            <Row>
                                                <Text variant="tertiary" typographyStyle="label">
                                                    <CoinBalance
                                                        symbol={option.symbol as NetworkSymbol}
                                                        value={option.balance ?? '0'}
                                                    />
                                                </Text>
                                            </Row>
                                            <Row justifyContent="flex-start">
                                                {option.contractAddress && option.cryptoName && (
                                                    <Text
                                                        variant="tertiary"
                                                        typographyStyle="label"
                                                    >
                                                        <Row gap={spacings.xxxs}>
                                                            <Translation id="TR_CONTRACT_ADDRESS" />{' '}
                                                            <TokenAddressComponent
                                                                tokenContractAddress={
                                                                    option.contractAddress
                                                                }
                                                                shouldAllowCopy={true}
                                                                typographyStyle="label"
                                                                variant="tertiary"
                                                                tokenExplorerUrl={
                                                                    option.tokenExplorerUrl
                                                                }
                                                                onCopy={() =>
                                                                    onCopyAddress(
                                                                        option.contractAddress ||
                                                                            '',
                                                                        'contract',
                                                                    )
                                                                }
                                                            />
                                                        </Row>
                                                    </Text>
                                                )}
                                            </Row>
                                        </Column>
                                    </Row>
                                );
                            }}
                            styles={{
                                valueContainer: base => ({
                                    ...base,
                                    justifyContent: 'flex-start !important',
                                    zIndex: 1000,
                                }),
                            }}
                            data-testid="@amount-select"
                            isClean
                            isClearable={false}
                            isMenuOpen={false}
                        />
                    </TokenSelectContainer>
                )}
            />
        </>
    );
};
