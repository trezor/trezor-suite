import { useMemo } from 'react';

import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { TokenSymbol } from '@suite/token';
import { isSignValuePositive, useFormatters } from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { toTokenAddress } from '@suite-common/tokens';
import {
    type NetworkSymbol,
    type NetworkSymbolExtended,
    getDisplaySymbol,
    getNetworkOptional,
} from '@suite-common/wallet-config';
import { LOW_BALANCE_THRESHOLD } from '@suite-common/wallet-constants';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { BlurUrls, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { Sign } from '#src/components/suite/Sign';
import { useBitcoinAmountUnit } from '#src/hooks/wallet/useBitcoinAmountUnit';

const MAX_TOKEN_DISPLAYED_DECIMALS = 18;

export interface FormattedCryptoAmountProps {
    value?: string | number | AmountUnit; // Todo: remove `string | number`, its for Back Compatibility only
    symbol?: NetworkSymbolExtended;
    contractAddress?: string | null;
    /**
     * The token's network. With `contractAddress` it renders the symbol from token metadata, masked
     * only for unrecognized tokens; without it a token symbol is always masked.
     */
    networkSymbol?: NetworkSymbol;
    /** Compact formatting, for a balance shown next to its fiat value. */
    isCompact?: boolean;
    tokenDecimals?: number;
    showApproximation?: boolean;
    signValue?: SignValue;
    signGrayscale?: boolean;
    disableHiddenPlaceholder?: boolean;
    /**
     * If true, the `FormattedCryptoAmount` expects the `HiddenPlaceholder` upstream (it provides the `RedactNumbersContext`), else an error is thrown.
     */
    isRawString?: boolean;
    isTabular?: boolean;
    isSymbolSecondary?: boolean;
    'data-testid'?: string;
    className?: string;
}

export const FormattedCryptoAmount = ({
    value, // expects a value in full units (BTC not sats)
    symbol,
    contractAddress, // include contractAddress whenever the symbol is an token
    networkSymbol,
    isCompact = false,
    tokenDecimals,
    showApproximation = false,
    signValue,
    signGrayscale,
    disableHiddenPlaceholder,
    isRawString,
    isTabular = true,
    isSymbolSecondary = false,
    className,
    'data-testid': dataTest,
}: FormattedCryptoAmountProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    const { areSatsDisplayed } = useBitcoinAmountUnit();

    const isAmountLow = useMemo(() => {
        if (!value || !showApproximation) return false;
        const valueBn = new BigNumber(value);

        return !valueBn.isZero() && valueBn.lt(LOW_BALANCE_THRESHOLD);
    }, [value, showApproximation]);

    if (!value) {
        return null;
    }

    const lowerCaseSymbol = symbol?.toLowerCase();
    // A token's ticker can match a network symbol (`pol`, `op`, `arb`), so only the contract
    // address tells the two apart.
    const isToken = contractAddress !== undefined && contractAddress !== null;
    const {
        features: networkFeatures,
        testnet: isTestnet,
        symbol: amountNetworkSymbol,
        decimals: networkDecimals,
    } = (isToken ? undefined : getNetworkOptional(lowerCaseSymbol)) ?? {};

    const areSatsSupported = !!networkFeatures?.includes('amount-unit');

    let formattedSymbol = symbol && getDisplaySymbol(symbol, contractAddress);

    const isSatoshis = areSatsSupported && areSatsDisplayed;

    if (isSatoshis && amountNetworkSymbol) {
        formattedSymbol = isTestnet ? `sat ${formattedSymbol}` : 'sat';
    }

    const formatterContext = {
        symbol: amountNetworkSymbol,
        smallestUnitsOverride: isSatoshis,
        withSymbol: false,
        isEllipsisAppended: !isCompact,
        // Stated token decimals win: the symbol may resolve to an unrelated network.
        maxDisplayedDecimals: isCompact
            ? undefined
            : (tokenDecimals ?? networkDecimals ?? MAX_TOKEN_DISPLAYED_DECIMALS),
        formatStyle: isCompact ? 'compact-balance' : 'exact',
        tokenDecimals,
    } as const;

    let formattedValue = CryptoAmountFormatter.format(String(value), formatterContext);

    // Formatted, not hand-built, so the threshold is localized and in the unit shown beside it.
    if (isAmountLow && !isCompact) {
        formattedValue = `<${CryptoAmountFormatter.format(LOW_BALANCE_THRESHOLD, {
            ...formatterContext,
            maxDisplayedDecimals: undefined,
            formatStyle: 'exact',
        })}`;
    }

    const tokenContract = isToken && contractAddress ? toTokenAddress(contractAddress) : null;
    const getSymbolContent = () => {
        if (tokenContract && networkSymbol) {
            return <TokenSymbol networkSymbol={networkSymbol} tokenContract={tokenContract} />;
        }

        if (!formattedSymbol) return null;

        return (
            <BlurUrls
                tooltipContent={<Translation id="TR_URL_IN_TOKEN" />}
                text={formattedSymbol}
            />
        );
    };
    const symbolContent = getSymbolContent();

    // output as a string, mostly for compatibility with graphs
    if (isRawString) {
        const displayedSignValue = signValue ? `${isSignValuePositive(signValue) ? '+' : '-'}` : '';

        return (
            <>
                {displayedSignValue}
                {disableHiddenPlaceholder ? (
                    formattedValue
                ) : (
                    <RedactNumericalValue value={formattedValue} />
                )}{' '}
                {symbolContent}
            </>
        );
    }

    const renderedValue = disableHiddenPlaceholder ? (
        formattedValue
    ) : (
        <RedactNumericalValue value={formattedValue} />
    );

    const content = (
        <span data-testid={`${dataTest}-with-symbol`}>
            <span data-testid={dataTest}>
                {!!signValue && <Sign value={signValue} grayscale={signGrayscale} />}
                <Text isTabular={isTabular}>{renderedValue}</Text>
            </span>
            {symbolContent && (
                <>
                    {' '}
                    {isSymbolSecondary ? (
                        <Text intent="neutral" priority="secondary">
                            {symbolContent}
                        </Text>
                    ) : (
                        symbolContent
                    )}
                </>
            )}
        </span>
    );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder className={className}>{content}</HiddenPlaceholder>;
};
