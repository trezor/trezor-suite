import React from 'react';
import styled from 'styled-components';
import { colors, variables, Button } from '@trezor/components';
import { Translation, FormattedNumber, HiddenPlaceholder } from '@suite-components';

const Header = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding-bottom: 20px;
    border-bottom: solid 2px ${colors.BLACK96};
`;

const ValueWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.H1};
    font-weight: ${variables.FONT_WEIGHT.LIGHT};
    color: ${colors.BLACK17};
    font-variant-numeric: tabular-nums;
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

export interface Props {
    portfolioValue: string;
    localCurrency: string;
    actionsEnabled: boolean;
    // buyClickHandler: () => void;
    receiveClickHandler: () => void;
}

export default ({ portfolioValue, localCurrency, actionsEnabled, receiveClickHandler }: Props) => (
    <Header>
        <Left>
            <ValueWrapper>
                <HiddenPlaceholder intensity={7}>
                    <span>
                        <FormattedNumber value={portfolioValue} currency={localCurrency} />
                    </span>
                </HiddenPlaceholder>
            </ValueWrapper>
        </Left>
        <Right>
            {actionsEnabled && (
                <ActionButton variant="primary" onClick={receiveClickHandler}>
                    <Translation id="TR_RECEIVE" />
                </ActionButton>
            )}
            {/* <ActionButton variant="primary" onClick={buyClickHandler}>
                        <Translation id="TR_BUY" />
                    </ActionButton> */}
        </Right>
    </Header>
);
