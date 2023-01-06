import { useSelector } from '@suite-hooks';
import { selectDeviceState } from '@suite-reducers/suiteReducer';
import { selectIsCoinjoinBlockedByTor } from '@wallet-reducers/coinjoinReducer';
import { getIsCoinjoinOutOfSync } from '@wallet-utils/coinjoinUtils';

export const useBlockedCoinjoinResume = () => {
    const isCoinJoinBlockedByTor = useSelector(selectIsCoinjoinBlockedByTor);
    const { selectedAccount, online } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        online: state.suite.online,
    }));
    const isAccountOutOfSync = getIsCoinjoinOutOfSync(selectedAccount);
    const deviceStatus = useSelector(selectDeviceState);
    const isDeviceDisconnected = deviceStatus !== 'connected';

    let coinjoinResumeBlockedMessageId:
        | 'TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP'
        | 'TR_UNAVAILABLE_COINJOIN_DEVICE_DISCONNECTED'
        | 'TR_UNAVAILABLE_COINJOIN_ACCOUNT_OUT_OF_SYNC'
        | 'TR_UNAVAILABLE_COINJOIN_NO_INTERNET' = 'TR_UNAVAILABLE_COINJOIN_NO_INTERNET';

    if (!online) {
        coinjoinResumeBlockedMessageId = 'TR_UNAVAILABLE_COINJOIN_NO_INTERNET';
    } else if (isCoinJoinBlockedByTor) {
        coinjoinResumeBlockedMessageId = 'TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP';
    } else if (isDeviceDisconnected) {
        coinjoinResumeBlockedMessageId = 'TR_UNAVAILABLE_COINJOIN_DEVICE_DISCONNECTED';
    } else if (isAccountOutOfSync) {
        coinjoinResumeBlockedMessageId = 'TR_UNAVAILABLE_COINJOIN_ACCOUNT_OUT_OF_SYNC';
    }

    const isCoinjoinResumeBlocked =
        isCoinJoinBlockedByTor || isDeviceDisconnected || isAccountOutOfSync || !online;

    return {
        coinjoinResumeBlockedMessageId,
        isCoinjoinResumeBlocked,
    };
};
