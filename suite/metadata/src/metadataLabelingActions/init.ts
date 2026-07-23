import { type Dispatch } from '@reduxjs/toolkit';

import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { selectDeviceByStaticSessionId, selectSelectedDevice } from '@suite-common/device';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { type StaticSessionId } from '@trezor/connect';

import * as metadataActions from '../metadataActions';
import * as METADATA from '../metadataConstants';
import * as metadataDataThunks from '../metadataDataThunks';
import * as METADATA_LABELING from '../metadataLabelingConstants';
import * as metadataProviderActions from '../metadataProviderThunks';
import {
    type MetadataRootState,
    selectMetadata,
    selectSelectedProviderForLabels,
} from '../metadataReducer';
import * as metadataUtils from '../metadataUtils';
import { fetchAndSaveMetadata } from './fetchAndSaveMetadata';
import { setDeviceMetadataKey } from './setDeviceMetadataKey';
import { syncMetadataKeys } from './syncMetadataKeys';

const selectIsSuiteOnline = (state: MetadataRootState) => state.suite.online;

/**
 * Prepare everything needed to load, decrypt, upload and encrypt metadata. Not all steps
 * necessarily happen. For example, a user may enable metadata before the device has state.
 */
export const init =
    (force: boolean, deviceStateArg?: StaticSessionId) =>
    async (dispatch: Dispatch, getState: () => MetadataRootState, extra: ExtraDependencies) => {
        let device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device?.state?.staticSessionId) {
            return false;
        }

        if (!force && selectMetadata(getState()).error?.[device.state.staticSessionId]) {
            return false;
        }

        dispatch({ type: METADATA.SET_INITIATING, payload: true });
        if (selectMetadata(getState()).error?.[device.state.staticSessionId]) {
            // Remove error note about failed migration potentially set in a previous run.
            dispatch({
                type: METADATA.SET_ERROR_FOR_DEVICE,
                payload: {
                    deviceState: device.state.staticSessionId,
                    failed: false,
                },
            });
        }

        // 1. Set metadata enabled globally.
        const globalLabelingEnabledBeforeToggle = selectMetadata(getState()).enabled;
        if (!globalLabelingEnabledBeforeToggle) {
            dispatch(metadataActions.enableMetadata());
        }

        if (!device.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION]) {
            const result = await dispatch(
                setDeviceMetadataKey(device, METADATA_LABELING.ENCRYPTION_VERSION),
            );
            if (!result?.success) {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                dispatch({
                    type: METADATA.SET_ERROR_FOR_DEVICE,
                    payload: {
                        deviceState: device.state.staticSessionId,
                        failed: true,
                    },
                });

                // When the request for the device fails or is cancelled on the device, disable
                // metadata labeling for all only when it was off before this invocation.
                if (!globalLabelingEnabledBeforeToggle) {
                    dispatch(metadataDataThunks.disableMetadata());
                }

                return false;
            }
        }

        // 3. We have master key. Use it to derive account keys.
        dispatch(syncMetadataKeys(device, METADATA_LABELING.ENCRYPTION_VERSION));

        device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device) return false;

        // 4. Connect to provider.
        if (!selectSelectedProviderForLabels(getState())) {
            const providerResult = await dispatch(metadataProviderActions.initProvider());
            if (!providerResult) {
                asTypedDesktopAnalytics(extra.services.analytics).report({
                    type: events.settingsGeneralLabelingProviderEvent.name,
                    payload: {
                        provider: 'missing-provider',
                    },
                });

                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                // When the provider is not initialized, disable metadata labeling for all only
                // when it was off before this invocation.
                if (!globalLabelingEnabledBeforeToggle) {
                    dispatch(metadataDataThunks.disableMetadata());
                }

                return false;
            }
        }

        // Todo: 5. Migration.

        // 6. Fetch metadata.
        await dispatch(fetchAndSaveMetadata(device.state?.staticSessionId));

        // Now we may allow user to edit labels. Everything is ready and local data is synced.
        if (selectMetadata(getState()).initiating) {
            dispatch({ type: METADATA.SET_INITIATING, payload: false });
        }

        const selectedProvider = selectSelectedProviderForLabels(getState());
        device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device?.state?.staticSessionId || !selectedProvider) {
            return true;
        }

        const fetchIntervalTrackingId = metadataUtils.getFetchTrackingId(
            'labels',
            selectedProvider.clientId,
            device.state.staticSessionId,
        );

        // 7. If interval for watching provider is not set, create it.
        if (device.state && !metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
            // Todo: Possible race condition that has been around since always. User might be
            // editing a label at the exact moment an update arrives.
            metadataProviderActions.fetchIntervals[fetchIntervalTrackingId] = setInterval(() => {
                const selectedDevice = selectSelectedDevice(getState());
                if (!selectIsSuiteOnline(getState()) || !selectedDevice?.state?.staticSessionId) {
                    return;
                }
                dispatch(fetchAndSaveMetadata(selectedDevice.state.staticSessionId));
            }, METADATA_LABELING.FETCH_INTERVAL);
        }

        return true;
    };
