import { useSelector } from 'react-redux';

import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

import { discreetModeActions, selectIsDiscreteModeActive } from './discreetModeSlice';

export const useDiscreetMode = () => {
    const isDiscreetMode = useSelector(selectIsDiscreteModeActive);
    const { dispatch } = useServices(injectDispatch);

    const handleSetIsDiscreetMode = (value: boolean) => {
        dispatch(discreetModeActions.setDiscreetMode(value));
    };

    return {
        isDiscreetMode,
        setIsDiscreetMode: handleSetIsDiscreetMode,
    };
};
