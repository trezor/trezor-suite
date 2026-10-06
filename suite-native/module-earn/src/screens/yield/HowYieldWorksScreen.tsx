import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useIsFocused, useRoute } from '@react-navigation/native';

import {
    type EarnOnboardingRootState,
    getYieldEarnOpportunityKey,
    getYieldVaultContractAddress,
    selectIsEarnOnboardingConfirmed,
} from '@suite-common/wallet-core';
import { type YieldStackParamList, type YieldStackRoutes } from '@suite-native/navigation';

import { HowYieldWorksScreenContent } from './HowYieldWorksScreenContent';
import { StartYieldDepositScreen } from './StartYieldDepositScreen';
import { EarnLoadingScreen } from '../../components/earn/EarnLoadingScreen';
import { useMessageSystemYield } from '../../hooks/yield/useMessageSystemYield';
import { useYieldFlowData } from '../../hooks/yield/useYieldFlowData';

export const HowYieldWorksScreen = () => {
    const route = useRoute<RouteProp<YieldStackParamList, YieldStackRoutes.HowYieldWorks>>();
    const yieldFlowData = useYieldFlowData(route.params);
    const { vault, resolutionStatus } = yieldFlowData;
    const isFocused = useIsFocused();
    const isResolved = resolutionStatus === 'resolved';

    const vaultAddress = vault && getYieldVaultContractAddress(vault);
    const { isDisabled: isDepositDisabled } = useMessageSystemYield('deposit', {
        vaultContractAddress: vaultAddress ?? undefined,
    });
    const isConfirmed = useSelector((state: EarnOnboardingRootState) =>
        selectIsEarnOnboardingConfirmed(
            state,
            route.params.accountKey,
            getYieldEarnOpportunityKey(vaultAddress),
        ),
    );

    const [hasShownOnboarding, setHasShownOnboarding] = useState(false);
    const shouldStartDeposit =
        isResolved &&
        isConfirmed &&
        !route.params.isInfoOnly &&
        !isDepositDisabled &&
        !hasShownOnboarding;

    useEffect(() => {
        if (isResolved && !shouldStartDeposit && !hasShownOnboarding) {
            setHasShownOnboarding(true);
        }
    }, [isResolved, shouldStartDeposit, hasShownOnboarding]);

    if (!isResolved) {
        return <EarnLoadingScreen />;
    }

    if (shouldStartDeposit) {
        return isFocused ? <StartYieldDepositScreen yieldFlowData={yieldFlowData} /> : null;
    }

    return <HowYieldWorksScreenContent yieldFlowData={yieldFlowData} />;
};
