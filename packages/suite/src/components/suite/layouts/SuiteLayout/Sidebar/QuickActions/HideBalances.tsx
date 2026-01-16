import { useTranslation } from '@suite/intl';
import { selectIsDiscreteModeActive, setDiscreetMode } from '@suite-common/wallet-core';
import { Icon, iconSizes } from '@trezor/components';

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
        >
            <Icon
                name={isDiscreetModeActive ? 'eyeSlash' : 'eye'}
                variant="tertiary"
                size={iconSizes.medium}
            />
        </QuickActionButton>
    );
};
