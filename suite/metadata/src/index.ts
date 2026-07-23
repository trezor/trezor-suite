import { addAccountMetadata } from './metadataLabelingActions/addAccountMetadata';
import { addDeviceMetadata } from './metadataLabelingActions/addDeviceMetadata';
import { addMetadata } from './metadataLabelingActions/addMetadata';
import { fetchAndSaveMetadata } from './metadataLabelingActions/fetchAndSaveMetadata';
import { fetchAndSaveMetadataForAllDevices } from './metadataLabelingActions/fetchAndSaveMetadataForAllDevices';
import { init } from './metadataLabelingActions/init';
import { setAccountMetadataKey } from './metadataLabelingActions/setAccountMetadataKey';
import { setDeviceMetadataKey } from './metadataLabelingActions/setDeviceMetadataKey';
import { setEditing } from './metadataLabelingActions/setEditing';

export * from './metadataReducer';
export * from './metadataActions';
export * as metadataThunks from './metadataThunks';
export { default as GoogleClient } from './google';
export * from './metadataProviderThunks';
export * as metadataLabelingConstants from './metadataLabelingConstants';
export * as METADATA from './metadataConstants';
export { moveLabelsForRbfOldMetadataThunk } from './moveLabelsForRbfOldMetadataThunk';
export { MetadataProviderModal } from './MetadataProviderModal';
export { MetadataProviderSelectionModal } from './MetadataProviderSelectionModal';
export { metadataMiddleware } from './metadataMiddleware';
export { useLabelingDeviceState } from './useLabelingDeviceState';
export * from './fromLegacyMetadataToSearchLabels';
export * from './selectIsLegacyLabelingVisible';

export const metadataLabelingActions = {
    addAccountMetadata,
    addDeviceMetadata,
    addMetadata,
    fetchAndSaveMetadata,
    fetchAndSaveMetadataForAllDevices,
    init,
    setAccountMetadataKey,
    setDeviceMetadataKey,
    setEditing,
} as const;

// used in e2e tests
export * from './metadataUtils';

export { EntryForm } from './password-manager/EntryForm';
export { PasswordsList } from './password-manager/PasswordsList';
export { TagsList } from './password-manager/TagsList';
export { getNextId } from './password-manager/passwords';
export { usePasswords } from './password-manager/usePasswords';
