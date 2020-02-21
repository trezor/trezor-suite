import React from 'react';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components-v2';
import BigNumber from 'bignumber.js';
import Loading from './components/Loading';
import Exception from './components/Exception';
import EmptyWallet from './components/EmptyWallet';
import { Card, Translation, FormattedNumber, HiddenPlaceholder } from '@suite-components';
import messages from '@suite/support/messages';

const StyledCard = styled(Card)`
    flex-direction: column;
    min-height: 400px;
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

export type DashboardMode =
    | {
          status: 'loading';
          type: 'waiting-for-device' | 'auth' | 'discovery';
      }
    | {
          status: 'exception';
          type: 'auth-failed' | 'auth-confirm-failed';
      };

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    mode?: DashboardMode;
    portfolioValue: BigNumber;
    localCurrency: string;
    isDeviceEmpty: boolean | null;
    buyClickHandler: () => void;
    receiveClickHandler: () => void;
}

const PortfolioCard = ({
    mode,
    portfolioValue,
    localCurrency,
    buyClickHandler,
    receiveClickHandler,
    isDeviceEmpty,
    ...rest
}: Props) => {
    let body = null;
    if (mode) {
        body = mode.status === 'exception' ? <Exception /> : <Loading />;
    } else {
        body = isDeviceEmpty ? <EmptyWallet /> : <EmptyWallet />;
    }

    return (
        <StyledCard {...rest}>
            <Header>
                <Left>
                    <HeaderTitle>
                        <Translation {...messages.TR_TOTAL_PORTFOLIO_VALUE} />
                    </HeaderTitle>
                    <ValueWrapper>
                        <HiddenPlaceholder intensity={7}>
                            <FormattedNumber
                                value={portfolioValue.toString()}
                                currency={localCurrency}
                            />
                        </HiddenPlaceholder>
                    </ValueWrapper>
                </Left>
                <Right>
                    <ActionButton
                        isDisabled={!!mode}
                        variant="secondary"
                        onClick={receiveClickHandler}
                    >
                        <Translation {...messages.TR_RECEIVE} />
                    </ActionButton>
                    <ActionButton isDisabled={!!mode} variant="primary" onClick={buyClickHandler}>
                        <Translation {...messages.TR_BUY} />
                    </ActionButton>
                </Right>
            </Header>
            <Body>{body}</Body>
        </StyledCard>
    );
};

export default PortfolioCard;
