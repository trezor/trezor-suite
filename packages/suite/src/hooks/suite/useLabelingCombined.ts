import { disposeAllLocalFirstStorageThunk } from '@suite-common/local-first-storage';
import { selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';
import { initSuiteLocalFirstStorageThunk } from '@trezor/suite-local-first-storage';

import * as metadataActions from 'src/actions/suite/metadataActions';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';

import { useDispatch } from './useDispatch';
import { useSelector } from './useSelector';
import { setFlag } from '../../actions/suite/suiteActions';
import { selectSuiteFlags } from '../../selectors/suite/suiteSelectors';

type UseLabelingCombinedParams = {
    // This needs to be passed, as labeling can be attached to remembered wallets
    // and different devices can have different states (FW versions)
    deviceStaticSessionId: StaticSessionId | undefined;
};

export const useLabelingCombined = ({ deviceStaticSessionId }: UseLabelingCombinedParams) => {
    const dispatch = useDispatch();

    const device = useSelector(state =>
        deviceStaticSessionId !== undefined
            ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
            : undefined,
    );

    const { isLocalFirstStorageEnabled, isLocalFirstStorageDebugEnabled } =
        useSelector(selectSuiteFlags);
    const legacyMetadataState = useSelector(state => state.metadata);

    const legacyDisable = () => {
        dispatch(metadataActions.disableMetadata());
    };
    const localFirstDisable = () => {
        dispatch(setFlag('isLocalFirstStorageEnabled', false));
        dispatch(disposeAllLocalFirstStorageThunk());
    };
    const localFirstEnable = () => {
        legacyDisable(); // Enabling Evolu implicitly disables Legacy Labeling
        dispatch(setFlag('isLocalFirstStorageEnabled', true));
        dispatch(initSuiteLocalFirstStorageThunk());
    };
    const legacyEnable = () => {
        localFirstDisable(); // Enabling Legacy Labeling implicitly disables Evolu
        dispatch(metadataLabelingActions.init(true));
    };

    const isEvoluSupportedByDevice = device?.unavailableCapabilities?.evolu === undefined;

    const hasDeviceLocalFirstStorageKeys = device?.localFirstStorageSecret?.evoluKeys !== undefined;

    return {
        /** New Labeling: LocalFirstStorage (Evolu) */
        isLocalFirstStorageEnabled,
        isEvoluSupportedByDevice,
        isLocalFirstStorageDebugEnabled,
        hasDeviceLocalFirstStorageKeys,
        localFirstEnable,
        localFirstDisable,

        /** Legacy Labeling */
        legacyMetadataState,
        legacyEnable,
        legacyDisable,
    };
};
