import { ReactNode } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { FiatValue } from 'src/components/suite/FiatValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { NetworkSymbol } from 'src/types/wallet';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    height: 15px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    line-height: 1;

    > :first-child {
        margin-right: 6px;
        padding-bottom: 2px;
    }
`;

const CryptoAmount = styled(FormattedCryptoAmount)<{ $color?: string }>`
    margin: 6px 0 4px;
    color: ${({ theme, $color }) => $color || theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.H3};
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
        <FiatValue
            amount={formatNetworkAmount(value, symbol)}
            symbol={symbol}
            showApproximationIndicator
        />
    </Container>
);
