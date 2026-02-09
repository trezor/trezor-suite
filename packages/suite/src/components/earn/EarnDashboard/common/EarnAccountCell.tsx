import styled from 'styled-components';

import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacingsPx, typography } from '@trezor/theme';

import { AccountLabel, CoinBalance } from 'src/components/suite';

const AccountCellContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${spacingsPx.md};
    ${typography.hint};
    color: ${({ theme }) => theme.textSubdued};
    cursor: inherit;
`;

const AccountLabelContainer = styled.div`
    color: ${({ theme }) => theme.textDefault};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

type EarnAccountCellProps = {
    account?: Account;
    symbol?: NetworkSymbol;
};

export const EarnAccountCell = ({ account, symbol }: EarnAccountCellProps) => {
    const networkSymbol = account?.symbol ?? symbol;

    if (!networkSymbol) return null;

    return (
        <AccountCellContainer>
            <Column alignItems="center">
                <CoinLogo size={32} symbol={networkSymbol} />
            </Column>

            <Column flex="1" overflow="hidden" gap={2}>
                <AccountLabelContainer>
                    {account ? (
                        <AccountLabel
                            account={account}
                            showAccountTypeBadge={true}
                            accountTypeBadgeSize="small"
                        />
                    ) : (
                        symbol && getNetwork(symbol).name
                    )}
                </AccountLabelContainer>

                {account && <CoinBalance value={account.formattedBalance} symbol={networkSymbol} />}
            </Column>
        </AccountCellContainer>
    );
};
