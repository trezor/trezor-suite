import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { typography } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']}
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    height: 15px;
    ${typography['body-md-strong']}

    > :first-child {
        margin-right: 6px;
        padding-bottom: 2px;
    }
`;

const CryptoAmount = styled(FormattedCryptoAmount)<{ $color?: string }>`
    margin: 6px 0 4px;
    color: ${({ theme, $color }) => $color || theme.contentPrimary};
    ${typography['headline-sm']}
`;

interface CryptoAmountWithHeaderProps {
    header: ReactNode;
    headerIcon?: ReactNode;
    value: string;
    symbol: NetworkSymbol;
    color?: string;
    className?: string;
}

export const CryptoAmountWithHeader = ({
    header,
    headerIcon,
    value,
    symbol,
    color,
    className,
}: CryptoAmountWithHeaderProps) => (
    <Container className={className}>
        <Header>
            {headerIcon && headerIcon} {header}
        </Header>

        <CryptoAmount value={formatNetworkAmount(value, symbol)} symbol={symbol} $color={color} />
        <BaseCurrencyValue
            amount={formatNetworkAmount(value, symbol)}
            symbol={symbol}
            showApproximationIndicator
        />
    </Container>
);
