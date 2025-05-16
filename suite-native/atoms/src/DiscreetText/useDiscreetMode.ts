import { useDispatch, useSelector } from 'react-redux';

import { selectIsDiscreteModeActive, setDiscreetMode } from '@suite-common/wallet-core';

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
