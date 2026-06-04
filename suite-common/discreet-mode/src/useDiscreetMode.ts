import { useDispatch, useSelector } from 'react-redux';

import { setDiscreetMode } from './discreetModeActions';
import { selectIsDiscreteModeActive } from './discreetModeSelectors';

export const useDiscreetMode = () => {
    const isDiscreetMode = useSelector(selectIsDiscreteModeActive);
    const dispatch = useDispatch();

    const handleSetIsDiscreetMode = (value: boolean) => {
        dispatch(setDiscreetMode(value));
    };

    return {
        isDiscreetMode,
        setIsDiscreetMode: handleSetIsDiscreetMode,
    };
};
