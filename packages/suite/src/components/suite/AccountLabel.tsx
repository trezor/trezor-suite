import styled from 'styled-components';
import { BadgeSize, Row, TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountTypeBadge } from './AccountTypeBadge';
import { Bip43Path, NetworkType } from '@suite-common/wallet-config';
import { useDefaultAccountLabel } from 'src/hooks/suite';

const TabularNums = styled.span`
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    overflow: hidden;
`;

interface AccountLabelProps {
    accountLabel?: string;
    accountType: AccountType;
    symbol: NetworkSymbol;
    index?: number;
    showAccountTypeBadge?: boolean;
    accountTypeBadgeSize?: BadgeSize;
    path?: Bip43Path;
    networkType?: NetworkType;
}

export const AccountLabel = ({
    accountLabel,
    accountType = 'normal',
    path,
    networkType,
    showAccountTypeBadge,
    accountTypeBadgeSize = 'medium',
    symbol,
    index,
}: AccountLabelProps) => {
    const { getDefaultAccountLabel } = useDefaultAccountLabel();

    return (
        <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
            <Row gap={spacings.sm}>
                {accountLabel ? (
                    <TabularNums>{accountLabel}</TabularNums>
                ) : (
                    getDefaultAccountLabel({ accountType, symbol, index })
                )}
                {showAccountTypeBadge && (
                    <AccountTypeBadge
                        accountType={accountType}
                        size={accountTypeBadgeSize}
                        path={path}
                        networkType={networkType}
                    />
                )}
            </Row>
        </TruncateWithTooltip>
    );
};
