import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

import { discreetModeActions, selectIsDiscreteModeActive } from './discreetModeSlice';

export const useDiscreetMode = () => {
    const isDiscreetMode = useSelector(selectIsDiscreteModeActive);
    const { dispatch } = useServices(selectDispatch);

    const handleSetIsDiscreetMode = (value: boolean) => {
        dispatch(discreetModeActions.setDiscreetMode(value));
    };

    return {
        isDiscreetMode,
        setIsDiscreetMode: handleSetIsDiscreetMode,
    };
};
