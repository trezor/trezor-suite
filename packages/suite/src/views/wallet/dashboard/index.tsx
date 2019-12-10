import React from 'react';
import NetworkGroup from './components/NetworkGroup';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { Loader, Icon, colors } from '@trezor/components';
import { H2 } from '@trezor/components-v2';
import WalletLayout from '@wallet-components/WalletLayout';
import { sortByCoin } from '@wallet-utils/accountUtils';
import { NETWORKS } from '@wallet-config';
import { Network, Account } from '@wallet-types';
import { Props } from './Container';
import messages from '@suite/support/messages';

const Content = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const CardsWrapper = styled.div`
    margin-top: 10px;
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const AddMoreCoins = styled.div`
    display: flex;
    border: 1px solid ${colors.GRAY_LIGHT};
    border-radius: 4px;
    height: 110px;
    color: ${colors.TEXT_SECONDARY};
    justify-content: center;
    align-items: center;
    padding: 10px;
    cursor: pointer;

    &:hover {
        border: 1px solid ${colors.DIVIDER};
    }
`;

const IconWrapper = styled.div`
    padding-right: 5px;
`;

const LoadingContent = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Dashboard = (props: Props) => {
    const discovery = props.getDiscoveryForDevice();
    const { device } = props;
    const accounts = device
        ? sortByCoin(
              props.accounts.filter(a => a.deviceState === device.state && (!a.empty || a.visible)),
          )
        : [];
    const group: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
        if (!group[a.symbol]) {
            group[a.symbol] = [];
        }
        group[a.symbol].push(a);
    });

    const isLoading = !discovery || accounts.length < 1;

    return (
        <WalletLayout title="Dashboard">
            <Content data-test="Dashboard__page__content">
                <H2>Dashboard</H2>
                {isLoading && (
                    <LoadingContent>
                        <Loader size={30} />
                    </LoadingContent>
                )}
                {!isLoading && (
                    <CardsWrapper>
                        {Object.keys(group).map(symbol => {
                            const network = NETWORKS.find(
                                n => n.symbol === symbol && !n.accountType,
                            ) as Network;
                            return (
                                <NetworkGroup
                                    key={symbol}
                                    network={network}
                                    accounts={group[symbol]}
                                />
                            );
                        })}
                        <AddMoreCoins
                            onClick={() => {
                                props.goto('wallet-settings');
                            }}
                        >
                            <IconWrapper>
                                <Icon icon="PLUS" size={10} color={colors.TEXT_SECONDARY} />
                            </IconWrapper>
                            <Translation {...messages.TR_ADD_MORE_COINS} />
                        </AddMoreCoins>
                    </CardsWrapper>
                )}
            </Content>
        </WalletLayout>
    );
};

export default Dashboard;
