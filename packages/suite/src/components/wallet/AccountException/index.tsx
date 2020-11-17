import React from 'react';
import styled from 'styled-components';
import { H2 } from '@trezor/components';
import { AccountException } from '@wallet-reducers/selectedAccountReducer';

import AuthFailed from './AuthFailed';
import DiscoveryFailed from './DiscoveryFailed';
import DiscoveryEmpty from './DiscoveryEmpty';
import AccountNotEnabled from './AccountNotEnabled';
import AccountNotLoaded from './AccountNotLoaded';
import AccountNotExists from './AccountNotExists';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
`;

const Title = styled(H2)`
    display: flex;
    text-align: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

interface Props {
    account: AccountException;
}

const getExceptionPage = ({ account }: Props) => {
    switch (account.loader) {
        case 'auth-failed':
            return <AuthFailed />;
        case 'discovery-error':
            return <DiscoveryFailed />;
        case 'discovery-empty':
            return <DiscoveryEmpty />;
        case 'account-not-enabled':
            return <AccountNotEnabled network={account.network} />;
        case 'account-not-loaded':
            return <AccountNotLoaded />;
        case 'account-not-exists':
            return <AccountNotExists />;
        // no default
    }
};

const Exception = (props: Props) => {
    const page = getExceptionPage(props);
    if (page) return <Wrapper>{page}</Wrapper>;
    return (
        <Wrapper>
            <Title>Exception {props.account.loader} not implemented</Title>
        </Wrapper>
    );
};

export default Exception;
