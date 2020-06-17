import React from 'react';
import styled from 'styled-components';
import { WalletLayout } from '@wallet-components';
import { StateProps, DispatchProps } from './Container';
import { useDevice } from '@suite-hooks';
import SignMessage from './components/SignMessage';
import VerifyMessage from './components/VerifyMessage';
import { variables } from '@trezor/components';

const Row = styled.div`
    width: 45px;
    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        height: 25px;
    }
`;
const SignVerifyContainer = styled.div`
    display: flex;
    flex-direction: row;
    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

interface Props {
    selectedAccount: StateProps['selectedAccount'];
    notificationActions: DispatchProps['notificationActions'];
    signVerify: StateProps['signVerify'];
    suite: StateProps['suite'];
}

const SignVerify = (props: Props) => {
    const { selectedAccount, notificationActions, suite } = props;
    const { isLocked } = useDevice();
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Sign & Verify" account={selectedAccount} />;
    }

    return (
        <WalletLayout title="Sign & Verify" account={selectedAccount}>
            <SignVerifyContainer>
                <SignMessage
                    notificationActions={notificationActions}
                    account={selectedAccount.account}
                    isLocked={isLocked}
                    device={suite.device}
                />
                <Row />
                <VerifyMessage
                    notificationActions={notificationActions}
                    account={selectedAccount.account}
                    isLocked={isLocked}
                    device={suite.device}
                />
            </SignVerifyContainer>
        </WalletLayout>
    );
};

export default SignVerify;
