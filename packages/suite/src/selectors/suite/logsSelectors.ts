import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
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
    selectLanguage,
    selectTheme,
    selectTorOnionLinks,
} from '@suite/settings';
import { type TorRootState, selectIsTorEnabled } from '@suite/tor';
import {
    type LogsApplicationInfoRootState,
    REDACTED_REPLACEMENT,
    selectRedactedApplicationInfo,
} from '@suite-common/logger';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type DeviceState } from '@trezor/connect';

import { selectIsSuiteOnline, selectSuiteTransports } from './suiteSelectors';
import { type SuiteRootState } from '../../reducers/suite/suiteReducer';

export type SuiteLogsApplicationInfoRootState = SuiteRootState &
    TorRootState &
    MetadataRootState &
    DesktopUpdateRootState &
    DebugRootState &
    LogsApplicationInfoRootState;

const selectRedactedWallets = (
    state: SuiteLogsApplicationInfoRootState,
    shouldHideSensitiveData: boolean,
    supportedNetworks: readonly NetworkSymbol[],
) => {
    const commonApplicationInfo = selectRedactedApplicationInfo(
        state,
        shouldHideSensitiveData,
        supportedNetworks,
    );

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
    supportedNetworks: readonly NetworkSymbol[],
) => ({
    debugMenu: selectIsDebugModeActive(state),
    online: selectIsSuiteOnline(state),
    language: selectLanguage(state),
    autodetectLanguage: selectAutodetectLanguage(state),
    theme: selectTheme(state),
    autodetectTheme: selectAutodetectTheme(state),
    tor: selectIsTorEnabled(state),
    torOnionLinks: selectTorOnionLinks(state),
    transports: selectSuiteTransports(state),
    earlyAccessProgram: selectDesktopUpdateAllowPrerelease(state),
    labeling: selectSelectedLabelsProviderType(state),
    wallets: selectRedactedWallets(state, shouldHideSensitiveData, supportedNetworks),
});
