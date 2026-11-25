import { useMemo } from 'react';

import { AssetSymbol } from '@suite/assets';
import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useShouldRedactNumbers } from '@suite-common/discreet-mode';
import { isSignValuePositive, useFormatters } from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { useTokenMetadata } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import {
    type NetworkSymbolExtended,
    getDisplaySymbol,
    getNetworkOptional,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { LOW_BALANCE_THRESHOLD } from '@suite-common/wallet-constants';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { BlurUrls, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { Sign } from '#src/components/suite/Sign';
import { useBitcoinAmountUnit } from '#src/hooks/wallet/useBitcoinAmountUnit';

const MAX_TOKEN_DISPLAYED_DECIMALS = 18;

export type FormattedCryptoAmountProps = {
    value?: string | number | AmountUnit; // Todo: remove `string | number`, its for Back Compatibility only
    networkSymbol?: NetworkSymbolExtended;
    contractAddress?: string | null;
    tokenDecimals?: number;
    tokenSymbol?: string;
    /** Compact formatting, for a balance shown next to its fiat value. */
    isCompact?: boolean;
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
};

export const FormattedCryptoAmount = ({
    value, // expects a value in full units (BTC not sats)
    networkSymbol,
    contractAddress, // include contractAddress whenever the symbol is an token
    isCompact = false,
    tokenDecimals,
    tokenSymbol,
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
    const shouldRedactNumbers = useShouldRedactNumbers({ strict: false });

    const { areSatsDisplayed } = useBitcoinAmountUnit();
    const tokenNetworkSymbol =
        networkSymbol !== undefined && isNetworkSymbol(networkSymbol) ? networkSymbol : undefined;
    const tokenContract = contractAddress ? toTokenAddress(contractAddress) : undefined;
    const token = useTokenMetadata(tokenNetworkSymbol, tokenContract);

    const isAmountLow = useMemo(() => {
        if (!value || !showApproximation) return false;
        const valueBn = new BigNumber(value);

        return !valueBn.isZero() && valueBn.lt(LOW_BALANCE_THRESHOLD);
    }, [value, showApproximation]);

    if (!value) {
        return null;
    }

    const amountTokenDecimals = tokenDecimals ?? token?.decimals;
    const lowerCaseSymbol = networkSymbol?.toLowerCase();
    // A token's ticker can match a network symbol (`pol`, `op`, `arb`), so only the contract
    // address tells the two apart.
    const isToken = contractAddress !== undefined && contractAddress !== null;
    const network = isToken ? undefined : getNetworkOptional(lowerCaseSymbol);

    const areSatsSupported = !!network?.features.includes('amount-unit');

    let formattedSymbol =
        tokenSymbol ?? (networkSymbol && getDisplaySymbol(networkSymbol, contractAddress));

    const isSatoshis = areSatsSupported && areSatsDisplayed;

    if (isSatoshis && network) {
        formattedSymbol = network.testnet ? `sat ${formattedSymbol}` : 'sat';
    }

    const formatterContext = {
        symbol: network?.symbol,
        smallestUnitsOverride: isSatoshis,
        withSymbol: false,
        isEllipsisAppended: !isCompact,
        // Stated token decimals win: the symbol may resolve to an unrelated network.
        maxDisplayedDecimals: isCompact
            ? undefined
            : (amountTokenDecimals ?? network?.decimals ?? MAX_TOKEN_DISPLAYED_DECIMALS),
        formatStyle: isCompact ? 'compact-balance' : 'exact',
        tokenDecimals: amountTokenDecimals,
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

    const shouldMaskAmount = !disableHiddenPlaceholder || shouldRedactNumbers;
    const renderedValue = shouldMaskAmount ? (
        <RedactNumericalValue value={formattedValue} />
    ) : (
        formattedValue
    );

    const getSymbolContent = () => {
        if (isSatoshis) return formattedSymbol;

        if (network) return <AssetSymbol networkSymbol={network.symbol} />;

        if (tokenNetworkSymbol && tokenContract && tokenSymbol === undefined) {
            return (
                <AssetSymbol
                    networkSymbol={tokenNetworkSymbol}
                    contractAddress={tokenContract}
                    isTruncated
                />
            );
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
                {renderedValue} {symbolContent}
            </>
        );
    }

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
