import { JSX } from 'react';

import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAreSatsAmountUnit,
    selectBaseCurrency,
    selectIsDiscreteModeActive,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { BaseCurrencyAmount, isTestnet } from '@suite-common/wallet-utils';
import { valuablesBaseCurrencyCodes } from '@trezor/blockchain-link-types';
import {
    Column,
    Row,
    SkeletonRectangle,
    TOOLTIP_DELAY_LONG,
    TruncateWithTooltip,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { isArrayMember } from '@trezor/utils';

import {
    AccountLabel,
    BaseCurrencyValue,
    CoinBalance,
    HiddenPlaceholder,
    Translation,
} from 'src/components/suite';
import { useLoadingSkeleton, useSelector } from 'src/hooks/suite';
import { AccountItemType } from 'src/types/wallet';

const AccountLabelContainer = styled.div`
    flex: 1;
    min-width: 60px;
    color: ${({ theme }) => theme.textDefault};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

type ItemContentProps = {
    customFiatValue?: BaseCurrencyAmount;
    account: Account;
    type: AccountItemType;
    formattedBalance: string;
    dataTestKey?: string;
    isFiatLoading?: boolean;
};

const FiatValueRenderComponent = ({ value }: { value: JSX.Element | null }) => {
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    if (discreetMode || value === null) return value;

    return <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>{value}</TruncateWithTooltip>;
};

type BaseCurrencyProps = {
    isLoading?: boolean;
    symbol: NetworkSymbol;
    customFiatValue?: BaseCurrencyAmount;
    formattedBalance: string;
};

const BaseCurrency = ({
    isLoading,
    symbol,
    customFiatValue,
    formattedBalance,
}: BaseCurrencyProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { shouldAnimate } = useLoadingSkeleton();
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);
    const isBtcAmountInSats = useSelector(selectAreSatsAmountUnit);

    // This is special case, here is Account list we have a little space, so we never show
    // decimal places for fiat currencies (fiat always have 2 or 3 decimal places),
    // where subunits are insignificant (little value).
    //
    // But we want to show decimal places for crypto (BTC) base currencies as they usually
    // have very significant subunits.
    const isBitcoinInSats = baseCurrencyCode === 'btc' && isBtcAmountInSats;

    const forceZeroDecimalPlaces =
        !isBitcoinInSats && !isArrayMember(baseCurrencyCode, valuablesBaseCurrencyCodes);

    return shallDisplayBaseCurrency && customFiatValue !== undefined ? (
        <HiddenPlaceholder>
            {isLoading ? (
                <SkeletonRectangle animate={shouldAnimate} />
            ) : (
                <BaseCurrencyAmountFormatter
                    value={customFiatValue}
                    currency={baseCurrencyCode}
                    {...(forceZeroDecimalPlaces
                        ? {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                          }
                        : {})}
                />
            )}
        </HiddenPlaceholder>
    ) : (
        <BaseCurrencyValue
            amount={formattedBalance}
            symbol={symbol}
            fiatAmountFormatterOptions={
                forceZeroDecimalPlaces
                    ? {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                      }
                    : undefined
            }
        >
            {FiatValueRenderComponent}
        </BaseCurrencyValue>
    );
};

export const AccountItemContent = ({
    customFiatValue,
    account,
    type,
    formattedBalance,
    dataTestKey,
    isFiatLoading,
}: ItemContentProps) => {
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    const { shouldAnimate } = useLoadingSkeleton();

    const isBalanceShown = account.backendType !== 'coinjoin' || account.status !== 'initial';

    return (
        // Content is constant size in discreet mode, so overflow: hidden is unnecessary.
        // Though it would cut off CSS blur effect, so we may turn it off
        <Column flex="1" overflow={discreetMode ? 'visible' : 'hidden'} gap={spacings.xxxs}>
            <Row gap={spacings.md} margin={{ right: spacings.xxs }} justifyContent="space-between">
                <AccountLabelContainer data-testid={`${dataTestKey}/label`}>
                    {type === 'coin' && <AccountLabel account={account} />}
                    {type === 'staking' && <Translation id="TR_NAV_STAKING" />}
                    {type === 'tokens' && <Translation id="TR_NAV_TOKENS" />}
                </AccountLabelContainer>
                <BaseCurrency
                    isLoading={isFiatLoading}
                    customFiatValue={customFiatValue}
                    symbol={account.symbol}
                    formattedBalance={formattedBalance}
                />
            </Row>
            {isBalanceShown && type !== 'tokens' && (
                <CoinBalance
                    data-testid="@wallet"
                    value={formattedBalance}
                    symbol={account.symbol}
                />
            )}
            {!isBalanceShown && (
                <Column gap={spacings.xs}>
                    <SkeletonRectangle width="100px" height="16px" animate={shouldAnimate} />

                    {!isTestnet(account.symbol) && (
                        <SkeletonRectangle width="100px" height="16px" animate={shouldAnimate} />
                    )}
                </Column>
            )}
        </Column>
    );
};
