import { useTranslation } from '@suite/intl';
import { selectIsDiscreteModeActive, setDiscreetMode } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { QuickActionButton } from './QuickActionButton';

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
