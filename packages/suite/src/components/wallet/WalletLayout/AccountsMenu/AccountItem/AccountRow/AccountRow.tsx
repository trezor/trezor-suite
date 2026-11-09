import styled, { css } from 'styled-components';

import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, Row } from '@trezor/components';
import { commonFocusStyles } from '@trezor/components/src/utils/utils';
import { TokenIcon } from '@trezor/product-components';

import { type Account } from 'src/types/wallet';

import { AccountItemContent } from './AccountItemContent';

const Container = styled.button<{ $isActive?: boolean; $isCollapsed?: boolean }>`
    display: flex;
    align-items: center;
    padding: 8px;
    border-radius: 12px;
    transition:
        background 0.2s ease-in-out,
        box-shadow 0.2s ease-in-out,
        outline 0.2s ease-in-out,
        outline-offset 0.2s ease-in-out;
    cursor: pointer;
    border: 0;
    background: none;
    min-width: 0;
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
    dataTestKey: string;
    tokenCount: number;
    hasStaking: boolean;
    account: Account;
    customFiatValue?: BaseCurrencyAmount;
    isFiatLoading: boolean;
};

export const AccountRow = ({
    isSelected,
    handleHeaderClick,
    isCollapsed = false,
    dataTestKey,
    tokenCount,
    hasStaking,
    account,
    customFiatValue,
    isFiatLoading,
}: AccountRowProps) => (
    <Container
        $isCollapsed={isCollapsed}
        $isActive={isSelected}
        onClick={handleHeaderClick}
        data-testid={dataTestKey}
        type="button"
    >
        <Row gap={8} width="100%">
            <Box position={{ type: 'relative' }} zIndex={0}>
                <TokenIcon size={24} symbol={account.symbol} />
            </Box>
            {!isCollapsed && (
                <AccountItemContent
                    customFiatValue={customFiatValue}
                    account={account}
                    tokenCount={tokenCount}
                    hasStaking={hasStaking}
                    dataTestKey={dataTestKey}
                    isFiatLoading={isFiatLoading}
                />
            )}
        </Row>
    </Container>
);
