import { useMemo, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Select, variables } from '@trezor/components';
import { components } from 'react-select';
import styled from 'styled-components';
import { useSendFormContext } from 'src/hooks/wallet';
import { Account } from 'src/types/wallet';
import { Output } from 'src/types/wallet/sendForm';
import {
    getShortFingerprint,
    enhanceTokensWithRates,
    sortTokensWithRates,
} from '@suite-common/wallet-utils';
import { useSelector } from 'src/hooks/suite';
import { selectCoinsLegacy, selectTokenDefinitions } from '@suite-common/wallet-core';
import BigNumber from 'bignumber.js';
import { TokenDefinitions } from '@suite-common/wallet-types';
import { TooltipSymbol, Translation } from 'src/components/suite';
import { getNetworkFeatures } from '@suite-common/wallet-config';

const UnrecognizedTokensHeading = styled.div`
    display: flex;
    align-items: center;
`;

interface Option {
    options: {
        label: string;
        value: string | null;
        fingerprint?: string;
    }[];
    label?: React.ReactNode;
}

export const buildTokenOptions = (
    tokens: Account['tokens'],
    symbol: Account['symbol'],
    tokenDefinitions: TokenDefinitions,
) => {
    // ETH option
    const result: Option[] = [
        {
            options: [{ value: null, fingerprint: undefined, label: symbol.toUpperCase() }],
        },
    ];

    if (tokens) {
        const unknownTokens: Option['options'] = [];
        const hasNetworkFeatures = getNetworkFeatures(symbol).includes('token-definitions');

        tokens.forEach(token => {
            if (new BigNumber(token?.balance || '').eq('0')) {
                return;
            }

            const tokenName = token.symbol || 'N/A';

            if (tokenDefinitions[token.contract]?.isTokenKnown || !hasNetworkFeatures) {
                result[0].options.push({
                    value: token.contract,
                    label: tokenName.toUpperCase(),
                    fingerprint: token.name,
                });
            } else {
                unknownTokens.push({
                    value: token.contract,
                    label: `${tokenName.toUpperCase().slice(0, 7)}…`,
                    fingerprint: token.name,
                });
            }
        });

        if (unknownTokens.length) {
            result.push({
                label: (
                    <UnrecognizedTokensHeading>
                        <Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR" />
                        <TooltipSymbol
                            content={<Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP" />}
                        />
                    </UnrecognizedTokensHeading>
                ),
                options: unknownTokens,
            });
        }
    }

    return result;
};

interface TokenSelectProps {
    output: Partial<Output>;
    outputId: number;
}

const OptionValueName = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
    height: 1.2em;
    white-space: nowrap;
    margin: 5px 0;
`;

const OptionWrapper = styled.div`
    max-width: 200px;

    @media (max-width: ${variables.SCREEN_SIZE.XL}) {
        max-width: 120px;
    }
`;

const OptionValue = styled.div`
    word-break: break-all;
    font-variant-numeric: slashed-zero tabular-nums;
`;

const OptionEmptyName = styled.div`
    font-style: italic;
`;

const CardanoOption = ({ tokenInputName, ...optionProps }: any) => (
    <components.Option
        {...optionProps}
        innerProps={{
            ...optionProps.innerProps,
            'data-test': `${tokenInputName}/option/${optionProps.value}`,
        }}
    >
        <OptionWrapper>
            <OptionValueName>
                {optionProps.data.fingerprint &&
                optionProps.data.label.toLowerCase() ===
                    optionProps.data.fingerprint.toLowerCase() ? (
                    <OptionEmptyName>No name</OptionEmptyName>
                ) : (
                    optionProps.data.label
                )}
            </OptionValueName>
            <OptionValue>
                {optionProps.data.fingerprint
                    ? getShortFingerprint(optionProps.data.fingerprint)
                    : null}
            </OptionValue>
        </OptionWrapper>
    </components.Option>
);

const CardanoSingleValue = ({ tokenInputName, ...optionProps }: any) => (
    <components.SingleValue {...optionProps} innerProps={{ ...optionProps.innerProps }}>
        {optionProps.data.fingerprint &&
        optionProps.data.label.toLowerCase() === optionProps.data.fingerprint.toLowerCase()
            ? getShortFingerprint(optionProps.data.fingerprint)
            : optionProps.data.label}
    </components.SingleValue>
);

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
    } = useSendFormContext();
    const coins = useSelector(selectCoinsLegacy);
    const tokenDefinitions = useSelector(state => selectTokenDefinitions(state, account.symbol));

    const sortedTokens = useMemo(() => {
        const tokensWithRates = enhanceTokensWithRates(account.tokens, coins);

        return tokensWithRates.sort(sortTokensWithRates);
    }, [account.tokens, coins]);

    const tokenInputName = `outputs.${outputId}.token` as const;
    const amountInputName = `outputs.${outputId}.amount` as const;
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');
    const options = buildTokenOptions(sortedTokens, account.symbol, tokenDefinitions);

    // Amount needs to be re-validated again AFTER token change propagation (decimal places, available balance)
    // watch token change and use "useSendFormFields.setAmount" util for validation (if amount is set)
    // if Amount is not valid 'react-hook-form' will set an error to it, and composeTransaction will be prevented
    // N0TE: do this conditionally only for ETH and when set-max is not enabled
    const tokenWatch = watch(tokenInputName, null);
    useEffect(() => {
        if (account.networkType === 'ethereum' && !isSetMaxActive) {
            const amountValue = getValues(`outputs.${outputId}.amount`) as string;
            if (amountValue) setAmount(outputId, amountValue);
        }
    }, [outputId, tokenWatch, setAmount, getValues, account.networkType, isSetMaxActive]);

    const customComponents =
        account.networkType === 'cardano'
            ? {
                  Option: CardanoOption,
                  SingleValue: CardanoSingleValue,
              }
            : undefined;

    return (
        <Controller
            control={control}
            name={tokenInputName}
            data-test={tokenInputName}
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
                    components={customComponents}
                    isClean
                    onChange={(selected: Option['options'][0]) => {
                        // change selected value
                        onChange(selected.value);
                        // clear errors in Amount input
                        clearErrors(amountInputName);
                        // remove Amount if isSetMaxActive or ETH data options are enabled
                        if (isSetMaxActive || dataEnabled) setAmount(outputId, '');
                        // remove ETH data option
                        if (dataEnabled) toggleOption('ethereumData');
                        // compose (could be prevented because of Amount error from re-validation above)
                        composeTransaction(amountInputName);
                    }}
                    data-test="@amount-select"
                />
            )}
        />
    );
};
