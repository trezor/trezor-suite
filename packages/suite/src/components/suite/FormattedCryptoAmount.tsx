import styled from 'styled-components';
import { HiddenPlaceholder, Sign } from 'src/components/suite';
import { getNetworkOptional, NetworkSymbol } from '@suite-common/wallet-config';
import { useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

import { SignValue } from '@suite-common/suite-types';
import {
    formatCoinBalance,
    localizeNumber,
    networkAmountToSatoshi,
} from '@suite-common/wallet-utils';
import { isSignValuePositive } from '@suite-common/formatters';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

const Container = styled.span`
    max-width: 100%;
`;

const Value = styled.span`
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export interface FormattedCryptoAmountProps {
    value?: string | number;
    symbol?: string;
    isBalance?: boolean;
    signValue?: SignValue;
    disableHiddenPlaceholder?: boolean;
    isRawString?: boolean;
    'data-testid'?: string;
    className?: string;
}

export const FormattedCryptoAmount = ({
    value, // expects a value in full units (BTC not sats)
    symbol,
    isBalance,
    signValue,
    disableHiddenPlaceholder,
    isRawString,
    'data-testid': dataTest,
    className,
}: FormattedCryptoAmountProps) => {
    const locale = useSelector(selectLanguage);

    const { areSatsDisplayed } = useBitcoinAmountUnit();

    if (!value) {
        return null;
    }

    const lowerCaseSymbol = symbol?.toLowerCase();
    const { features: networkFeatures, testnet: isTestnet } =
        getNetworkOptional(lowerCaseSymbol) ?? {};

    const areSatsSupported = !!networkFeatures?.includes('amount-unit');

    let formattedValue = value;
    let formattedSymbol = symbol?.toUpperCase();

    const isSatoshis = areSatsSupported && areSatsDisplayed;

    // convert to satoshis if needed
    if (isSatoshis) {
        formattedValue = networkAmountToSatoshi(String(value), lowerCaseSymbol as NetworkSymbol);

        formattedSymbol = isTestnet ? `sat ${symbol?.toUpperCase()}` : 'sat';
    }

    // format truncation + locale (used for balances) or just locale
    if (isBalance) {
        formattedValue = formatCoinBalance(String(formattedValue), locale);
    } else {
        formattedValue = localizeNumber(formattedValue, locale);
    }

    // output as a string, mostly for compatibility with graphs
    if (isRawString) {
        const displayedSignValue = signValue ? `${isSignValuePositive(signValue) ? '+' : '-'}` : '';

        return <>{`${displayedSignValue} ${formattedValue} ${formattedSymbol}`}</>;
    }

    const content = (
        <Container className={className}>
            {!!signValue && <Sign value={signValue} />}
            <Value data-testid={dataTest}>{formattedValue}</Value>
            {formattedSymbol && (
                <>
                    {' '}
                    <BlurUrls text={formattedSymbol} />
                </>
            )}
        </Container>
    );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder className={className}>{content}</HiddenPlaceholder>;
};
