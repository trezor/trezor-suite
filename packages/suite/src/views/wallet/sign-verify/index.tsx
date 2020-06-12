import React from 'react';
import styled from 'styled-components';
import { WalletLayout } from '@wallet-components';
import { StateProps, DispatchProps } from './Container';
import { useDevice } from '@suite-hooks';
import SignMessage from './components/SignMessage';
import VerifyMessage from './components/VerifyMessage';

const StyledWalletLayout = styled(WalletLayout)`
    flex-direction: row; // 1. dont work, why?
`;

const Row = styled.div`
    padding-bottom: 28px;
    display: flex;
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
        <StyledWalletLayout title="Sign & Verify" account={selectedAccount}>
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
        </StyledWalletLayout>
    );
};

export default SignVerify;
