import { Icon, iconSizes } from '@trezor/components';

import { QuickActionButton } from './QuickActionButton';
import { setDiscreetMode } from '../../../../../../actions/settings/walletSettingsActions';
import { useDispatch, useSelector, useTranslation } from '../../../../../../hooks/suite';
import { selectIsDiscreteModeActive } from '../../../../../../reducers/wallet/settingsReducer';

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
        >
            <Icon
                name={isDiscreetModeActive ? 'eyeSlash' : 'eye'}
                variant="tertiary"
                size={iconSizes.medium}
            />
        </QuickActionButton>
    );
};
