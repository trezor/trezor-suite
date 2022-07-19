import React from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder, Sign } from '@suite-components';
import { formatCurrencyAmount } from '@wallet-utils/formatCurrencyAmount';
import { networkAmountToSatoshi } from '@suite-common/wallet-utils';
import { isValuePositive, SignValue } from '@suite-components/Sign';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';
import { NETWORKS } from '@wallet-config';
import { NetworkSymbol } from '@wallet-types';

const Container = styled.span`
    max-width: 100%;
`;

const Value = styled.span`
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Symbol = styled.span`
    word-break: initial;
`;

interface FormattedCryptoAmountProps {
    value: string | number | undefined;
    symbol: string | undefined;
    signValue?: SignValue;
    disableHiddenPlaceholder?: boolean;
    isRawString?: boolean;
    'data-test'?: string;
    className?: string;
}

export const FormattedCryptoAmount = ({
    value,
    symbol,
    signValue,
    disableHiddenPlaceholder,
    isRawString,
    'data-test': dataTest,
    className,
}: FormattedCryptoAmountProps) => {
    const { areSatsDisplayed } = useBitcoinAmountUnit();

    if (!value) {
        return null;
    }

    const { features: networkFeatures, testnet: isTestnet } =
        NETWORKS.find(network => network.symbol === symbol) ?? {};

    const areSatsSupported = !!networkFeatures?.includes('amount-unit');

    let formattedValue = value;
    let formattedSymbol = symbol?.toUpperCase();

    const isSatoshis = areSatsSupported && areSatsDisplayed;

    if (isSatoshis) {
        formattedValue = formatCurrencyAmount(
            Number(networkAmountToSatoshi(String(value), symbol as NetworkSymbol)),
        ) as string;

        formattedSymbol = isTestnet ? `sat ${symbol?.toUpperCase()}` : 'sat';
    }

    if (isRawString) {
        return (
            <>
                {`${signValue ? `${isValuePositive(signValue) ? '+' : '-'}` : ''} ${formattedValue}
                ${formattedSymbol}`}
            </>
        );
    }

    const content = (
        <Container className={className}>
            {signValue && <Sign value={signValue} />}

            <Value data-test={dataTest}>{formattedValue}</Value>

            {symbol && <Symbol>&nbsp;{formattedSymbol}</Symbol>}
        </Container>
    );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder className={className}>{content}</HiddenPlaceholder>;
};
