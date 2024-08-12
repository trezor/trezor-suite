import { useMemo, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Select } from '@trezor/components';
import styled from 'styled-components';
import { useSendFormContext } from 'src/hooks/wallet';
import { Account } from 'src/types/wallet';
import { Output, WalletParams } from '@suite-common/wallet-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { updateFiatRatesThunk, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { TooltipSymbol, Translation } from 'src/components/suite';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    enhanceTokensWithRates,
    formatTokenSymbol,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { TokenDefinitions, selectCoinDefinitions } from '@suite-common/token-definitions';

const UnrecognizedTokensHeading = styled.div`
    display: flex;
    align-items: center;
`;

interface Option {
    options: {
        label: string;
        value: string | null;
    }[];
    label?: React.ReactNode;
}

export const buildTokenOptions = (
    accountTokens: Account['tokens'],
    symbol: Account['symbol'],
    coinDefinitions: TokenDefinitions['coin'],
) => {
    // native token option
    const result: Option[] = [
        {
            options: [{ value: null, label: symbol.toUpperCase() }],
        },
    ];

    if (accountTokens) {
        const tokens = getTokens(accountTokens, symbol, coinDefinitions);

        tokens.shownWithBalance.forEach(token => {
            result[0].options.push({
                value: token.contract,
                label: formatTokenSymbol(token.symbol || token.contract),
            });
        });

        if (tokens.hiddenWithBalance.length) {
            result.push({
                label: (
                    <UnrecognizedTokensHeading>
                        <Translation id="TR_HIDDEN_TOKENS" />
                    </UnrecognizedTokensHeading>
                ),
                options: tokens.hiddenWithBalance.map(token => ({
                    value: token.contract,
                    label: formatTokenSymbol(token.symbol || token.contract),
                })),
            });
        }

        if (tokens.unverifiedWithBalance.length) {
            result.push({
                label: (
                    <UnrecognizedTokensHeading>
                        <Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR" />
                        <TooltipSymbol
                            content={<Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP" />}
                        />
                    </UnrecognizedTokensHeading>
                ),
                options: tokens.unverifiedWithBalance.map(token => ({
                    value: token.contract,
                    label: formatTokenSymbol(token.symbol || token.contract),
                })),
            });
        }
    }

    return result;
};

interface TokenSelectProps {
    output: Partial<Output>;
    outputId: number;
}

export const TokenSelect = ({ output, outputId }: TokenSelectProps) => {
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
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const tokensWithRates = enhanceTokensWithRates(
        account.tokens,
        localCurrency,
        account.symbol,
        fiatRates,
    );
    const dispatch = useDispatch();
    const routerParams = useSelector(state => state.router.params) as WalletParams;

    const sortedTokens = useMemo(() => {
        return tokensWithRates.sort(sortTokensWithRates);
    }, [tokensWithRates]);

    const tokenInputName = `outputs.${outputId}.token` as const;
    const amountInputName = `outputs.${outputId}.amount` as const;
    const currencyInputName = `outputs.${outputId}.currency` as const;
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');
    const options = buildTokenOptions(sortedTokens, account.symbol, coinDefinitions);

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
        if (routerParams?.contractAddress) {
            setValue(tokenInputName, routerParams.contractAddress, { shouldValidate: true });
            setDraftSaveRequest(true);
        }
    }, [routerParams?.contractAddress, setValue, tokenInputName, setDraftSaveRequest]);

    return (
        <Controller
            control={control}
            name={tokenInputName}
            data-testid={tokenInputName}
            defaultValue={tokenValue}
            render={({ field: { onChange } }) => (
                <Select
                    options={options}
                    minValueWidth="58px"
                    isSearchable
                    isDisabled={options.length === 1 && options[0].options.length === 1} // disable when account has no tokens to choose from
                    value={options
                        .flatMap(group => group.options)
                        .find(option => option.value === tokenValue)}
                    isClearable={false}
                    isClean
                    onChange={async (selected: Option['options'][0]) => {
                        // change selected value
                        onChange(selected.value);
                        await dispatch(
                            updateFiatRatesThunk({
                                ticker: {
                                    symbol: account.symbol as NetworkSymbol,
                                    tokenAddress: selected.value as TokenAddress,
                                },
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
                    }}
                    data-testid="@amount-select"
                />
            )}
        />
    );
};
