import React from 'react';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components';
import BigNumber from 'bignumber.js';
import Loading from './components/Loading';
import Exception from './components/Exception';
import EmptyWallet from './components/EmptyWallet';
import DashboardGraph from './components/DashboardGraph/Container';
import { Card, Translation, FormattedNumber, HiddenPlaceholder } from '@suite-components';
import { Account } from '@wallet-types';

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Header = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 20px;
    border-bottom: solid 2px #f5f5f5;
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
    deviceAccounts: Account[];
    portfolioValue: BigNumber;
    localCurrency: string;
    isDeviceEmpty: boolean | null;
    discoveryInProgress: boolean;
    buyClickHandler: () => void;
    receiveClickHandler: () => void;
}

const PortfolioCard = ({
    mode,
    deviceAccounts,
    portfolioValue,
    localCurrency,
    buyClickHandler,
    receiveClickHandler,
    isDeviceEmpty,
    discoveryInProgress,
    ...rest
}: Props) => {
    let body = null;
    if (mode) {
        body = mode.status === 'exception' ? <Exception /> : <Loading />;
    } else {
        body = isDeviceEmpty ? (
            <EmptyWallet />
        ) : (
            <DashboardGraph discoveryInProgress={discoveryInProgress} accounts={deviceAccounts} />
        );
    }

    return (
        <StyledCard {...rest}>
            {/* <StyledCard {...rest} title={<Translation id="TR_TOTAL_PORTFOLIO_VALUE" />}> */}
            <Header>
                <Left>
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
                        variant="primary"
                        onClick={receiveClickHandler}
                    >
                        <Translation id="TR_RECEIVE" />
                    </ActionButton>
                    {/* <ActionButton isDisabled={!!mode} variant="primary" onClick={buyClickHandler}>
                        <Translation id="TR_BUY" />
                    </ActionButton> */}
                </Right>
            </Header>
            <Body>{body}</Body>
        </StyledCard>
    );
};

export default PortfolioCard;
