import { selectIsDiscreteModeActive, setDiscreetMode } from '@suite-common/wallet-core';

import { QuickActionButton } from './QuickActionButton';
import { useDispatch, useSelector, useTranslation } from '../../../../../../hooks/suite';

export const HideBalances = () => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const isDiscreetModeActive = useSelector(selectIsDiscreteModeActive);
    const translationLabel = isDiscreetModeActive ? 'TR_SHOW_BALANCES' : 'TR_HIDE_BALANCES';

    const handleDiscreetModeClick = () => dispatch(setDiscreetMode(!isDiscreetModeActive));

    return (
        <QuickActionButton
            tooltip={{ content: translationString(translationLabel) }}
            onClick={handleDiscreetModeClick}
            data-testid="@quickActions/hideBalances"
            iconName={isDiscreetModeActive ? 'eyeSlash' : 'eye'}
        />
    );
};
