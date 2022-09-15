import React, { useState } from 'react';
import { CoinjoinSetupStrategies } from './CoinjoinSetupStrategies';
import { Account } from '@suite-common/wallet-types';
import { AccountSummarySection } from './AccountSummarySection';

interface CoinjoinSetupProps {
    account: Account;
}

export const CoinjoinSetup = ({ account }: CoinjoinSetupProps) => {
    const [setupStep, setSetupStep] = useState(0);

    if (setupStep === 0) {
        return <AccountSummarySection onAnonimize={() => setSetupStep(1)} />;
    }

    return <CoinjoinSetupStrategies account={account} />;
};
