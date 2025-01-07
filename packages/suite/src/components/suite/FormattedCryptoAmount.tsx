import styled from 'styled-components';

import {
    getDisplaySymbol,
    getNetworkOptional,
    type NetworkSymbolExtended,
} from '@suite-common/wallet-config';
import { SignValue } from '@suite-common/suite-types';
import {
    formatCoinBalance,
    localizeNumber,
    networkAmountToSmallestUnit,
} from '@suite-common/wallet-utils';
import { isSignValuePositive } from '@suite-common/formatters';
import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useSelector } from 'src/hooks/suite';
import { HiddenPlaceholder, Sign } from 'src/components/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { RedactNumericalValue } from './RedactNumericalValue';

const Value = styled.span`
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export interface FormattedCryptoAmountProps {
    value?: string | number;
    symbol?: NetworkSymbolExtended;
    contractAddress?: string | null;
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
    contractAddress, // include contractAddress whenever the symbol is an token
    isBalance,
    signValue,
    disableHiddenPlaceholder,
    isRawString,
    className,
    'data-testid': dataTest,
}: FormattedCryptoAmountProps) => {
    const locale = useSelector(selectLanguage);

    const { areSatsDisplayed } = useBitcoinAmountUnit();

    if (!value) {
        return null;
    }

    const lowerCaseSymbol = symbol?.toLowerCase();
    const {
        features: networkFeatures,
        testnet: isTestnet,
        symbol: networkSymbol,
    } = getNetworkOptional(lowerCaseSymbol) ?? {};

    const areSatsSupported = !!networkFeatures?.includes('amount-unit');

    let formattedValue = value;
    let formattedSymbol = symbol && getDisplaySymbol(symbol, contractAddress);

    const isSatoshis = areSatsSupported && areSatsDisplayed;

    // convert to satoshis if needed
    if (isSatoshis && networkSymbol) {
        formattedValue = networkAmountToSmallestUnit(String(value), networkSymbol);

        formattedSymbol = isTestnet ? `sat ${formattedSymbol}` : 'sat';
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

        return (
            <>
                {displayedSignValue} <RedactNumericalValue value={formattedValue} />{' '}
                {formattedSymbol}
            </>
        );
    }

    const content = (
        <Row width="100%" gap={spacings.xxs}>
            <Row data-testid={dataTest}>
                {!!signValue && <Sign value={signValue} />}
                <Value>
                    <RedactNumericalValue value={formattedValue} />
                </Value>
            </Row>
            {formattedSymbol && (
                <>
                    {' '}
                    <BlurUrls text={formattedSymbol} />
                </>
            )}
        </Row>
    );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder className={className}>{content}</HiddenPlaceholder>;
};
