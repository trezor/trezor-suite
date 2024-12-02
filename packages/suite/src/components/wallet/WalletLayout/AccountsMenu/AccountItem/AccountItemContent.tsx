import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { useFormatters } from '@suite-common/formatters';
import { spacings } from '@trezor/theme';
import {
    SkeletonRectangle,
    TOOLTIP_DELAY_LONG,
    TruncateWithTooltip,
    Column,
    Row,
} from '@trezor/components';
import { isTestnet } from '@suite-common/wallet-utils';

import { useLoadingSkeleton, useSelector } from '../../../../../hooks/suite';
import { selectLocalCurrency } from '../../../../../reducers/wallet/settingsReducer';
import {
    AccountLabel,
    CoinBalance,
    FiatValue,
    HiddenPlaceholder,
    Translation,
} from '../../../../suite';
import { AccountItemType } from '../../../../../types/wallet';

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
}: ItemContentProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const localCurrency = useSelector(selectLocalCurrency);
    const { shouldAnimate } = useLoadingSkeleton();

    const isBalanceShown = account.backendType !== 'coinjoin' || account.status !== 'initial';

    return (
        <Column flex="1" overflow="hidden" gap={spacings.xxxs}>
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
                        <FiatAmountFormatter
                            value={customFiatValue}
                            currency={localCurrency}
                            minimumFractionDigits={0}
                            maximumFractionDigits={0}
                        />
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
                        {({ value }) =>
                            value ? (
                                <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                                    {value}
                                </TruncateWithTooltip>
                            ) : null
                        }
                    </FiatValue>
                )}
            </Row>
            {isBalanceShown && type !== 'tokens' && (
                <CoinBalance value={formattedBalance} symbol={symbol} />
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
