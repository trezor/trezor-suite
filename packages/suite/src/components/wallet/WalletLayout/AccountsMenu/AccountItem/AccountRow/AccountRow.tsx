import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, GhostContainer, Row } from '@trezor/components';

import { type Account, type AccountItemType } from 'src/types/wallet';

import { AccountItemContent } from './AccountItemContent';
import { AccountItemLogo } from '../AccountItemLogo/AccountItemLogo';

export type AccountRowProps = {
    isSelected: boolean;
    handleHeaderClick: () => void;
    dataTestKey?: string;
    type: AccountItemType;
    account: Account;
    customFiatValue?: BaseCurrencyAmount;
    formattedBalance: string;
    isFiatLoading?: boolean;
};

export const AccountRow = ({
    isSelected,
    handleHeaderClick,
    dataTestKey,
    type,
    account,
    customFiatValue,
    formattedBalance,
    isFiatLoading,
}: AccountRowProps) => (
    <GhostContainer
        isActive={isSelected}
        onClick={handleHeaderClick}
        data-testid={dataTestKey}
        tabIndex={0}
        padding={8}
    >
        <Row justifyContent="space-between" gap={16}>
            <Box position={{ type: 'relative' }}>
                <AccountItemLogo type={type} account={account} />
            </Box>
            <AccountItemContent
                customFiatValue={customFiatValue}
                account={account}
                type={type}
                formattedBalance={formattedBalance}
                dataTestKey={dataTestKey}
                isFiatLoading={Boolean(isFiatLoading)}
            />
        </Row>
    </GhostContainer>
);
