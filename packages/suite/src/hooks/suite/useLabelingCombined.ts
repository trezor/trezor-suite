import { disposeAllLocalFirstStorageThunk } from '@suite-common/local-first-storage';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { initSuiteLocalFirstStorageThunk } from '@trezor/suite-local-first-storage';

import * as metadataActions from 'src/actions/suite/metadataActions';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';

import { useDispatch } from './useDispatch';
import { useSelector } from './useSelector';
import { setFlag } from '../../actions/suite/suiteActions';
import { selectSuiteFlags } from '../../selectors/suite/suiteSelectors';

export const useLabelingCombined = () => {
    const dispatch = useDispatch();

    // Todo: device needs to be passed as arg
    const device = useSelector(selectSelectedDevice);

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

    return {
        /** New Labeling: LocalFirstStorage (Evolu) */
        isLocalFirstStorageEnabled,
        isEvoluSupportedByDevice,
        isLocalFirstStorageDebugEnabled,
        localFirstEnable,
        localFirstDisable,

        /** Legacy Labeling */
        legacyMetadataState,
        legacyEnable,
        legacyDisable,
    };
};
