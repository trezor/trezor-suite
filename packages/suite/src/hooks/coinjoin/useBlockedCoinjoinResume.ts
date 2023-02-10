import { TranslationKey } from '@suite-common/intl-types';
import { useSelector } from '@suite-hooks';
import {
    Feature,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-reducers/messageSystemReducer';
import { selectDeviceState } from '@suite-reducers/suiteReducer';
import { selectIsCoinjoinSelectedAccountBlockedByTor } from '@wallet-reducers/coinjoinReducer';
import { getIsCoinjoinOutOfSync } from '@wallet-utils/coinjoinUtils';

export const useBlockedCoinjoinResume = () => {
    const isCoinjoinBlockedByTor = useSelector(selectIsCoinjoinSelectedAccountBlockedByTor);
    const isCoinjoinDisabledByFeatureFlag = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.coinjoin),
    );
    const featureMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.coinjoin),
    );
    const { selectedAccount, online } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        online: state.suite.online,
    }));
    const isAccountOutOfSync = getIsCoinjoinOutOfSync(selectedAccount);
    const deviceStatus = useSelector(selectDeviceState);
    const isDeviceDisconnected = deviceStatus !== 'connected';

    let coinjoinResumeBlockedMessageId: TranslationKey | undefined;

    if (!online) {
        coinjoinResumeBlockedMessageId = 'TR_UNAVAILABLE_COINJOIN_NO_INTERNET';
    } else if (isCoinjoinBlockedByTor) {
        coinjoinResumeBlockedMessageId = 'TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP';
    } else if (isDeviceDisconnected) {
        coinjoinResumeBlockedMessageId = 'TR_UNAVAILABLE_COINJOIN_DEVICE_DISCONNECTED';
    } else if (isAccountOutOfSync) {
        coinjoinResumeBlockedMessageId = 'TR_UNAVAILABLE_COINJOIN_ACCOUNT_OUT_OF_SYNC';
    }

    const isCoinjoinResumeBlocked =
        isCoinjoinBlockedByTor ||
        isDeviceDisconnected ||
        isAccountOutOfSync ||
        !online ||
        isCoinjoinDisabledByFeatureFlag;

    return {
        coinjoinResumeBlockedMessageId,
        isCoinjoinResumeBlocked,
        featureMessageContent,
    };
};
