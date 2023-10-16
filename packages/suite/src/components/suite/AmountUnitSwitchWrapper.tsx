import { ReactNode } from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { NetworkSymbol } from 'src/types/wallet';
import { Translation } from './Translation';
import { mediaQueries } from '@trezor/styles';

const Container = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin: -2px -12px;
    padding: 2px 12px;
    border-radius: 6px;
    transition: background 0.1s ease-in;
    cursor: pointer;
    ${mediaQueries.hover} {
        :hover {
            background: ${({ theme }) => theme.BG_GREY};
        }
    }
`;

interface AmountUnitSwitchWrapperProps {
    symbol: NetworkSymbol;
    children: ReactNode;
}

export const AmountUnitSwitchWrapper = ({ symbol, children }: AmountUnitSwitchWrapperProps) => {
    const { areSatsDisplayed, toggleBitcoinAmountUnits, areUnitsSupportedByNetwork } =
        useBitcoinAmountUnit(symbol);

    if (!areUnitsSupportedByNetwork) {
        return <>{children}</>;
    }

    return (
        <Tooltip
            cursor="default"
            maxWidth={200}
            delay={[600, 0]}
            placement="bottom"
            interactive={false}
            hideOnClick={false}
            content={<Translation id={areSatsDisplayed ? 'TR_TO_BTC' : 'TR_TO_SATOSHIS'} />}
        >
            <Container
                onClick={toggleBitcoinAmountUnits}
                data-test={`amount-unit-switch/${symbol}`}
            >
                {children}
            </Container>
        </Tooltip>
    );
};
