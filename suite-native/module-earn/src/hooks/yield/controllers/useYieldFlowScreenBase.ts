import { useIsFocused } from '@react-navigation/native';

import {
    type YieldPositionFlowType,
    getYieldVaultContractAddress,
} from '@suite-common/wallet-core';
import { type YieldFlowParams } from '@suite-native/navigation';

import { useMessageSystemYield } from '../useMessageSystemYield';
import { useShowYieldTransactionFailureAlert } from '../useShowYieldTransactionFailureAlert';
import { useYieldFlowData } from '../useYieldFlowData';
import { useYieldSession } from '../useYieldSession';

type UseYieldFlowScreenBaseParams = {
    flowType: YieldPositionFlowType;
    /** Redeem uses the withdraw message-system key. */
    messageSystemType?: YieldPositionFlowType;
    routeParams: YieldFlowParams;
    shouldDisposeSessionOnGoBack?: boolean;
};

export const useYieldFlowScreenBase = ({
    flowType,
    messageSystemType = flowType,
    routeParams,
    shouldDisposeSessionOnGoBack,
}: UseYieldFlowScreenBaseParams) => {
    const isFocused = useIsFocused();

    const yieldFlowData = useYieldFlowData(routeParams);
    const { flowKey, vault } = yieldFlowData;

    const vaultContractAddress = vault ? getYieldVaultContractAddress(vault) : undefined;
    const messageSystem = useMessageSystemYield(messageSystemType, { vaultContractAddress });

    const session = useYieldSession({
        flowKey,
        flowType,
        isWrappedNativeVault: yieldFlowData.isWrappedNativeVault,
        shouldDisposeOnGoBack: shouldDisposeSessionOnGoBack,
    });

    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType,
        isEnabled: isFocused,
    });

    return { isFocused, messageSystem, session, yieldFlowData };
};
