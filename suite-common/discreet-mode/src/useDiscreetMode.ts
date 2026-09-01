import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';

import { discreetModeActions, selectIsDiscreteModeActive } from './discreetModeSlice';

export const useDiscreetMode = () => {
    const isDiscreetMode = useSelector(selectIsDiscreteModeActive);
    const dispatch = useDispatch();

    const handleSetIsDiscreetMode = (value: boolean) => {
        dispatch(discreetModeActions.setDiscreetMode(value));
    };

    return {
        isDiscreetMode,
        setIsDiscreetMode: handleSetIsDiscreetMode,
    };
};
