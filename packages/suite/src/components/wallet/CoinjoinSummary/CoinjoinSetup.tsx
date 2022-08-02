import React, { useState } from 'react';
import styled from 'styled-components';
import { CoinjoinAnonymityGraph } from './CoinjoinAnonymityGraph';
import { CoinjoinSetupStart } from './CoinjoinSetupStart';
import { CoinjoinSetupStrategies } from './CoinjoinSetupStrategies';
import { Account } from '@suite-common/wallet-types';

const WrapperStart = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
`;

interface CoinjoinSetupProps {
    account: Account;
}

export const CoinjoinSetup = ({ account }: CoinjoinSetupProps) => {
    const [setupStep, setSetupStep] = useState(0);
    if (setupStep === 0) {
        return (
            <WrapperStart>
                <CoinjoinAnonymityGraph account={account} />
                <CoinjoinSetupStart account={account} onContinue={() => setSetupStep(1)} />
            </WrapperStart>
        );
    }

    return <CoinjoinSetupStrategies account={account} />;
};
