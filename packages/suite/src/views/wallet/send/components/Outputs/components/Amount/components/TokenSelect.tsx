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
import { selectCoinsLegacy } from '@suite-common/wallet-core';

interface Option {
    label: string;
    value: string | null;
    fingerprint: string | undefined;
}

export const buildTokenOptions = (tokens: Account['tokens'], symbol: Account['symbol']) => {
    // ETH option
    const result: Option[] = [
        {
            value: null,
            fingerprint: undefined,
            label: symbol.toUpperCase(),
        },
    ];

    if (tokens) {
        tokens.forEach(token => {
            const tokenName = token.symbol || 'N/A';
            result.push({
                value: token.contract,
                label: tokenName.toUpperCase(),
                fingerprint: token.name,
            });
        });
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
                    // eslint-disable-next-line react/jsx-indent
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

    const sortedTokens = useMemo(() => {
        const tokensWithRates = enhanceTokensWithRates(account.tokens, coins);

        return tokensWithRates.sort(sortTokensWithRates);
    }, [account.tokens, coins]);

    const tokenInputName = `outputs.${outputId}.token` as const;
    const amountInputName = `outputs.${outputId}.amount` as const;
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');
    const options = buildTokenOptions(sortedTokens, account.symbol);

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
                    minWidth="58px"
                    isSearchable
                    isDisabled={options.length === 1} // disable when account has no tokens to choose from
                    hideTextCursor
                    value={options.find(o => o.value === tokenValue)}
                    isClearable={false}
                    components={customComponents}
                    isClean
                    onChange={(selected: Option) => {
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
