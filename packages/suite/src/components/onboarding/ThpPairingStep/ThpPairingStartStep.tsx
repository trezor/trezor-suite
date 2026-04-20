import { useEffect, useState } from 'react';

import { startThpSessionThunk } from '@suite/firmware';
import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';

import { useDispatch } from 'src/hooks/suite';

// reflection of components/firmware/ThpPairing/ThpPairingStartStep
export const ThpPairingStartStep = (props: { isLoading?: boolean }) => {
    const [isLoading, setIsLoading] = useState(props.isLoading);
    const dispatch = useDispatch();
    useEffect(() => {
        setIsLoading(props.isLoading);
    }, [props.isLoading]);

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
