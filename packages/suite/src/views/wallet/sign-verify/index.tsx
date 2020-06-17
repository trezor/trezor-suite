import React from 'react';
import styled from 'styled-components';
import { WalletLayout } from '@wallet-components';
import { StateProps } from './Container';
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
}

const SignVerify = ({ selectedAccount }: Props) => {
    const { isLocked } = useDevice();
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Sign & Verify" account={selectedAccount} />;
    }

    return (
        <WalletLayout title="Sign & Verify" account={selectedAccount}>
            <SignVerifyContainer>
                <SignMessage account={selectedAccount.account} isLocked={isLocked} />
                <Row />
                <VerifyMessage account={selectedAccount.account} isLocked={isLocked} />
            </SignVerifyContainer>
        </WalletLayout>
    );
};

export default SignVerify;
