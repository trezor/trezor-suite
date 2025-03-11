import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import {
    Column,
    Row,
    SkeletonRectangle,
    TOOLTIP_DELAY_LONG,
    TruncateWithTooltip,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import {
    AccountLabel,
    CoinBalance,
    FiatValue,
    HiddenPlaceholder,
    Translation,
} from 'src/components/suite';
import { useLoadingSkeleton, useSelector } from 'src/hooks/suite';
import {
    selectIsDiscreteModeActive,
    selectLocalCurrency,
} from 'src/reducers/wallet/settingsReducer';
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
    customFiatValue?: string;
    account: Account;
    type: AccountItemType;
    accountLabel?: string;
    accountType: AccountType;
    symbol: NetworkSymbol;
    index?: number;
    formattedBalance: string;
    dataTestKey?: string;
    isFiatLoading?: boolean;
};

const FiatValueRenderComponent = ({ value }: { value: JSX.Element | null }) => {
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    if (discreetMode || value === null) return value;

    return <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>{value}</TruncateWithTooltip>;
};

export const AccountItemContent = ({
    customFiatValue,
    account,
    type,
    accountLabel,
    accountType,
    symbol,
    index,
    formattedBalance,
    dataTestKey,
    isFiatLoading,
}: ItemContentProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const localCurrency = useSelector(selectLocalCurrency);
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    const { shouldAnimate } = useLoadingSkeleton();

    const isBalanceShown = account.backendType !== 'coinjoin' || account.status !== 'initial';

    return (
        // content is constant size in discreet mode, so overflow: hidden is unnecessary. Though it would cut off CSS blur effect, so we may turn it off
        <Column flex="1" overflow={discreetMode ? 'visible' : 'hidden'} gap={spacings.xxxs}>
            <Row gap={spacings.md} margin={{ right: spacings.xxs }} justifyContent="space-between">
                <AccountLabelContainer data-testid={`${dataTestKey}/label`}>
                    {type === 'coin' && (
                        <AccountLabel
                            accountLabel={accountLabel}
                            accountType={accountType}
                            symbol={symbol}
                            index={index}
                        />
                    )}
                    {type === 'staking' && <Translation id="TR_NAV_STAKING" />}
                    {type === 'tokens' && <Translation id="TR_NAV_TOKENS" />}
                </AccountLabelContainer>
                {customFiatValue && !isTestnet(symbol) ? (
                    <HiddenPlaceholder>
                        {isFiatLoading ? (
                            <SkeletonRectangle animate={shouldAnimate} />
                        ) : (
                            <FiatAmountFormatter
                                value={customFiatValue}
                                currency={localCurrency}
                                minimumFractionDigits={0}
                                maximumFractionDigits={0}
                            />
                        )}
                    </HiddenPlaceholder>
                ) : (
                    <FiatValue
                        amount={formattedBalance}
                        symbol={symbol}
                        fiatAmountFormatterOptions={{
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                        }}
                    >
                        {FiatValueRenderComponent}
                    </FiatValue>
                )}
            </Row>
            {isBalanceShown && type !== 'tokens' && (
                <CoinBalance data-testid="@wallet" value={formattedBalance} symbol={symbol} />
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
