import React from 'react';
import styled from 'styled-components';
import { Icon, IconType, variables } from '@trezor/components';
import { FiatValue } from '@suite-components/FiatValue';
import { FormattedCryptoAmount } from '@suite-components/FormattedCryptoAmount';
import { NetworkSymbol } from '@wallet-types';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    line-height: 1;
`;

const HeaderIcon = styled(Icon)`
    margin-right: 6px;
    padding-bottom: 2px;
`;

const CryptoAmount = styled(FormattedCryptoAmount)<{ color?: string }>`
    margin: 6px 0 4px;
    color: ${({ theme, color }) => color || theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.H3};
`;

const Note = styled.p`
    margin-top: 4px;
`;

interface CryptoAmountWithHeaderProps {
    header: React.ReactNode;
    headerIcon?: IconType;
    value: string;
    symbol: NetworkSymbol;
    color?: string;
    note?: React.ReactNode;
    className?: string;
}

export const CryptoAmountWithHeader = ({
    header,
    headerIcon,
    value,
    symbol,
    color,
    note,
    className,
}: CryptoAmountWithHeaderProps) => (
    <Container className={className}>
        <Header>
            {headerIcon && <HeaderIcon icon={headerIcon} size={14} />} {header}
        </Header>

        <CryptoAmount value={value} symbol={symbol} color={color} />
        <FiatValue amount={value} symbol={symbol} showApproximationIndicator />

        {note && <Note>{note}</Note>}
    </Container>
);
