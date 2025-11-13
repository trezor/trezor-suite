// Local Storage initialization ond disposal
export { disposeAllLocalFirstStorageThunk } from './storage/disposeAllLocalFirstStorageThunk';
export { initLocalFirstStorageThunkFactory } from './storage/initLocalFirstStorageThunk';
export { subscribeLocalFirstStorageThunk } from './storage/subscribeLocalFirstStorageThunk';
export { changeRelayUrlThunk } from './storage/changeRelayUrlThunk';
export { unsubscribeAndDisposeLocalFirstStorageThunk } from './storage/unsubscribeAndDisposeLocalFirstStorageThunk';
export { DEFAULT_SUITE_SYNC_RELAY_URL as DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL } from './storage/LocalFirstStorageProvider';

// Labeling
export { updateWalletLabelThunk } from './labeling/updateWalletLabelThunk';
export { updateAccountLabelThunk } from './labeling/updateAccountLabelThunk';
export { updateOutputLabelThunk } from './labeling/updateOutputLabelThunk';
export { updateAddressLabelThunk } from './labeling/updateAddressLabelThunk';
export {
    selectWalletLabel,
    selectAccountLabels,
    selectAddressLabels,
    selectAddressLabel,
    selectAccountLabel,
    selectOutputLabels,
    selectOutputLabel,
    selectIsLocalFirstStorageDebugEnabled,
    selectIsLocalFirstStorageEnabled,
    selectLocalFirstStorageRelayUrl,
    selectShouldOfferSecureSync,
    selectIsFeatureLocalFirstStorageAvailable,
} from './labeling/labelingSelectors';
export { findAccountLabel, findOutputLabel, findAddressLabel } from './labeling/selectorUtils';
export type { WithLabelingState } from './labeling/labelingSelectors';

import { labelingActions as labelingActionsImported } from './labeling/labelingActions';

// Todo: this shall be in LocalFirstStorage reducer, not labeling
export const labelingActions = {
    updateLocalFirstStorageEnabled: labelingActionsImported.updateLocalFirstStorageEnabled,
    updateLocalFirstStorageDebugEnabled:
        labelingActionsImported.updateLocalFirstStorageDebugEnabled,
    updateIsFeatureLocalFirstStorageAvailable:
        labelingActionsImported.updateIsFeatureLocalFirstStorageAvailable,

    /** @deprecated This is exported only for the `storageMiddleware`, do not use anywhere else! */
    setLocalFirstStorageRelayUrl: labelingActionsImported.setLocalFirstStorageRelayUrl,
};

export {
    prepareLabelingReducer,
    initialLabelingState,
    type LabelingSettings,
} from './labeling/labelingReducer';
export type { LabelingState } from './labeling/labelingReducer';
export { processMetadataMessageThunk } from './labeling/processMetadataMessageThunk';
export { useLocalFirstStorage } from './labeling/hooks/useLocalFirstStorage';
