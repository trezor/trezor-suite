import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import Content from '@wallet-components/Content';
import { AppState } from '@suite-types/index';
import { goto } from '@suite-actions/routerActions';
import LayoutAccount from '@wallet-components/LayoutAccount';

interface Props {
    suite: AppState['suite'];
    router: AppState['router'];
}

const Wallet = (props: Props) => {
    const { pathname, params } = props.router;
    const baseUrl = `${pathname}#/${params.coin}/`;
    return (
        <LayoutAccount>
            <Content>
                <Text>
                    {params.coin} Account {params.accountId} Send Page
                </Text>
                <Text>Other accounts</Text>
                <Button variant="success" onClick={() => goto(`${baseUrl}1`)}>
                    Account#1
                </Button>
                <Button variant="success" onClick={() => goto(`${baseUrl}2`)}>
                    Account#2
                </Button>
                <Text>Account subpages</Text>
                <Button variant="success" onClick={() => goto('/wallet/account', true)}>
                    Dashboard
                </Button>
                <Button variant="success" onClick={() => goto('/wallet/account/send', true)}>
                    Send
                </Button>
                <Button variant="success" onClick={() => goto('/wallet/account/receive', true)}>
                    Recv
                </Button>
                <Button variant="success" onClick={() => goto('/wallet/account/sign-verify', true)}>
                    Sign verify
                </Button>
            </Content>
        </LayoutAccount>
    );
};

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Wallet);
