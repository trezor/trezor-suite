import { useState } from 'react';

import { Translation } from '@suite/intl';

import { startThpSessionThunk } from 'src/actions/thp/startThpSessionThunk';
import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { useDispatch } from 'src/hooks/suite';

// reflection of components/firmware/ThpPairing/ThpPairingStartStep
export const ThpPairingStartStep = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const onClick = () => {
        setIsLoading(true);
        dispatch(startThpSessionThunk());
    };

    return (
        <OnboardingCard
            iconName="plugsConnected"
            description={<Translation id="TR_THP_CREATE_SECURE_CONNECTION_DESCRIPTION" />}
            heading={<Translation id="TR_THP_CREATE_SECURE_CONNECTION" />}
            innerActions={
                <OnboardingCard.Button onClick={onClick} isLoading={isLoading}>
                    <Translation id="TR_CONTINUE" />
                </OnboardingCard.Button>
            }
        />
    );
};
