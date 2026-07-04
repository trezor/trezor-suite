import styled, { css } from 'styled-components';

import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, Row } from '@trezor/components';
import { commonFocusStyles } from '@trezor/components/src/utils/utils';
import { borders, spacingsPx } from '@trezor/theme';

import { type Account, type AccountItemType } from 'src/types/wallet';

import { AccountItemContent } from './AccountItemContent';
import { AccountItemLogo } from '../AccountItemLogo/AccountItemLogo';

const Container = styled.button<{ $isActive?: boolean; $isCollapsed?: boolean }>`
    display: flex;
    align-items: center;
    padding: ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
    transition: 0.2s ease-in-out;
    cursor: pointer;
    border: 0;
    background: none;
    -webkit-app-region: no-drag;

    &:focus-visible {
        ${commonFocusStyles}
    }

    &:hover {
        background: ${({ theme }) => theme.elementFillGhostHovered};
    }

    ${({ $isActive, theme }) =>
        $isActive &&
        css`
            background: ${theme.elementFillElevated} !important;
            box-shadow: ${theme.elementShadowElevated};
        `}

    ${({ $isCollapsed }) =>
        $isCollapsed
            ? css`
                  margin: 0 auto;
              `
            : css`
                  flex: 1;
              `}
`;

export type AccountRowProps = {
    isSelected: boolean;
    handleHeaderClick: () => void;
    isCollapsed?: boolean;
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
    isCollapsed = false,
    dataTestKey,
    type,
    account,
    customFiatValue,
    formattedBalance,
    isFiatLoading,
}: AccountRowProps) => (
    <Container
        $isCollapsed={isCollapsed}
        $isActive={isSelected}
        onClick={handleHeaderClick}
        data-testid={dataTestKey}
        type="button"
    >
        <Row gap={16} width="100%">
            <Box position={{ type: 'relative' }} zIndex={0}>
                <AccountItemLogo type={type} account={account} />
            </Box>
            {!isCollapsed && (
                <AccountItemContent
                    customFiatValue={customFiatValue}
                    account={account}
                    type={type}
                    formattedBalance={formattedBalance}
                    dataTestKey={dataTestKey}
                    isFiatLoading={Boolean(isFiatLoading)}
                />
            )}
        </Row>
    </Container>
);
