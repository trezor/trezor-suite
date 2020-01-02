import React from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import FormattedNumber from '@suite-components/FormattedNumber';
import { colors, Button } from '@trezor/components-v2';

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Header = styled.div`
    display: flex;
    padding: 20px;
    flex-direction: row;
    flex-wrap: wrap;
    border-bottom: solid 2px #f5f5f5;
`;

const HeaderTitle = styled.div`
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: ${colors.BLACK50};
    text-transform: uppercase;
`;

const ValueWrapper = styled.div`
    font-size: 36px;
    font-weight: 300;
    color: ${colors.BLACK17};
`;

const Body = styled.div`
    display: flex;
    min-height: 100px;
    justify-content: center;
    align-items: center;
`;

const Left = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
`;

const ActionButton = styled(Button)`
    min-width: 150px;

    & + & {
        margin-left: 20px;
    }
`;

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    portfolioValue: string;
    localCurrency: string;
    buyClickHandler: () => void;
    receiveClickHandler: () => void;
}

const PortfolioCard = ({
    portfolioValue,
    localCurrency,
    buyClickHandler,
    receiveClickHandler,
    ...rest
}: Props) => {
    return (
        <StyledCard {...rest}>
            <Header>
                <Left>
                    <HeaderTitle>Total portfolio value</HeaderTitle>
                    <ValueWrapper>
                        <FormattedNumber
                            value={portfolioValue.toString()}
                            currency={localCurrency}
                        />
                    </ValueWrapper>
                </Left>
                <Right>
                    <ActionButton variant="secondary" onClick={receiveClickHandler}>
                        Receive
                    </ActionButton>
                    <ActionButton variant="primary" onClick={buyClickHandler}>
                        Buy
                    </ActionButton>
                </Right>
            </Header>
            <Body>graficek</Body>
        </StyledCard>
    );
};

export default PortfolioCard;
