import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import { State } from '@suite/types';
import { goto } from '@suite-actions/routerActions';

interface Props {
    suite: State['suite'];
    router: State['router'];
}

const Wallet = (props: Props) => {
    const { pathname, params } = props.router;
    const baseUrl = `${pathname}#/${params.coin}/`;
    return (
        <>
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
        </>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Wallet);
