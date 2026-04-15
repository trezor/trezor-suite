import {
    type DesktopUpdateRootState,
    selectDesktopUpdateAllowPrerelease,
} from '@suite/desktop-update';
import {
    type MetadataRootState,
    selectLabelingDataForWallet,
    selectSelectedLabelsProviderType,
} from '@suite/metadata';
import {
    selectAutodetectLanguage,
    selectAutodetectTheme,
    selectIsDebugModeActive,
    selectLanguage,
    selectTheme,
    selectTorOnionLinks,
} from '@suite/settings';
import {
    type LogsApplicationInfoRootState,
    REDACTED_REPLACEMENT,
    selectRedactedApplicationInfo,
} from '@suite-common/logger';
import { type DeviceState } from '@trezor/connect';

import { selectIsSuiteOnline, selectSuiteTransports, selectTorState } from './suiteSelectors';
import { type SuiteRootState } from '../../reducers/suite/suiteReducer';

export type SuiteLogsApplicationInfoRootState = SuiteRootState &
    MetadataRootState &
    DesktopUpdateRootState &
    LogsApplicationInfoRootState;

const selectRedactedWallets = (
    state: SuiteLogsApplicationInfoRootState,
    shouldHideSensitiveData: boolean,
) => {
    const commonApplicationInfo = selectRedactedApplicationInfo(state, shouldHideSensitiveData);

    return commonApplicationInfo.wallets.map(wallet => ({
        ...wallet,
        label: shouldHideSensitiveData
            ? REDACTED_REPLACEMENT
            : selectLabelingDataForWallet(state, wallet.deviceId as DeviceState).walletLabel,
    }));
};

export const selectRedactedDesktopApplicationInfo = (
    state: SuiteLogsApplicationInfoRootState,
    shouldHideSensitiveData: boolean,
) => ({
    debugMenu: selectIsDebugModeActive(state),
    online: selectIsSuiteOnline(state),
    language: selectLanguage(state),
    autodetectLanguage: selectAutodetectLanguage(state),
    theme: selectTheme(state),
    autodetectTheme: selectAutodetectTheme(state),
    tor: selectTorState(state).isTorEnabled,
    torOnionLinks: selectTorOnionLinks(state),
    transports: selectSuiteTransports(state),
    earlyAccessProgram: selectDesktopUpdateAllowPrerelease(state),
    labeling: selectSelectedLabelsProviderType(state),
    wallets: selectRedactedWallets(state, shouldHideSensitiveData),
});
