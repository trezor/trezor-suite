import React from 'react';
import { CoinLogo } from '@trezor/components';
import styled from 'styled-components';
import { AppState } from '@suite/types/suite';
import { connect } from 'react-redux';
import suiteConfig from '@suite-config';

import Loader from './Loader';

const Wrapper = styled.div``;

const Row = styled.div`
    padding: 5px 10px;
    display: flex;
`;

const Left = styled.div`
    display: flex;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    padding: 0 10px;
    align-items: center;
`;

const AccountType = styled.div``;
const Name = styled.div``;

interface Props {
    suite: AppState['suite'];
    wallet: AppState['wallet'];
    router: AppState['router'];
    discovery: AppState['wallet']['discovery'];
}

const getLoadingProgress = (discovery: AppState['wallet']['discovery']) => {
    const d = discovery[0];
    if (d && d.loaded && d.total) {
        return Math.round((d.loaded / d.total) * 100);
    }
    return 0;
};

const getCoinName = (networkType: string) => {
    const foundNetwork = suiteConfig.networks.find(network => network.type === networkType);
    if (foundNetwork) {
        return foundNetwork.name;
    } else {
        return 'unknown';
    }
};

const Menu = (props: Props) => (
    <Wrapper>
        <Loader progress={getLoadingProgress(props.discovery)} />
        {props.wallet.accounts.map(account => (
            <Row>
                <Left>
                    <CoinLogo size={24} network={account.network} />
                </Left>
                <Right>
                    <Name>{getCoinName(account.networkType)}</Name>
                    <AccountType>
                        {account.type !== 'normal' ? `(${account.type}) ` : ''}
                    </AccountType>
                </Right>
            </Row>
        ))}
    </Wrapper>
);

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    suite: state.suite,
    router: state.router,
    discovery: state.wallet.discovery,
});

export default connect(mapStateToProps)(Menu);
