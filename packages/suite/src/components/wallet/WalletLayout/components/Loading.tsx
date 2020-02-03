import React from 'react';
import styled from 'styled-components';
import { H2, colors, Loader } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { AppState } from '@suite-types';

const Loading = styled.div`
    display: flex;
    justify-content: center;
`;

const LoaderWrapper = styled.div`
    margin-right: 10px;
`;

const Title = styled(H2)`
    color: ${colors.BLACK0};
    padding: 0;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

interface Props {
    type: AppState['wallet']['selectedAccount']['loader'];
}

const getMessage = (type: Props['type']) => {
    switch (type) {
        case 'waiting-for-device':
            return messages.TR_LOADING_DEVICE_DOT_DOT_DOT;
        case 'auth':
            return messages.TR_AUTHENTICATING_DEVICE;
        case 'account-loading':
            return messages.TR_LOADING_ACCOUNT;
        default:
            return undefined;
    }
};

const AccountLoader = ({ type }: Props) => {
    const title = getMessage(type) || messages.TR_INITIALIZING_ACCOUNTS;
    return (
        <Loading>
            <Row>
                <LoaderWrapper>
                    <Loader size={30} />
                </LoaderWrapper>
                <Title textAlign="center">
                    <Translation>{title}</Translation>
                </Title>
            </Row>
        </Loading>
    );
};

export default AccountLoader;
