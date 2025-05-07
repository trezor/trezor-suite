import { useTheme } from 'styled-components';

import { ComponentWithSubIcon, Icon, iconSizes } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

import { NavBackends } from './NavBackends';
import { QuickActionButton } from './QuickActionButton';
import { useEnabledBackends } from '../../utils';

export const CustomBackend = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const enabledBackends = useEnabledBackends();
    const isCustomBackendIconVisible = enabledBackends.length > 0;

    const handleClick = () => {
        dispatch(goto('settings-coins'));
    };

    return (
        isCustomBackendIconVisible && (
            <QuickActionButton
                tooltip={{ content: <NavBackends customBackends={enabledBackends} /> }}
                onClick={handleClick}
            >
                <ComponentWithSubIcon
                    variant="primary"
                    subIconProps={{
                        name: 'check',
                        color: theme['iconDefaultInverted'],
                        size: iconSizes.extraSmall,
                    }}
                >
                    <Icon name="database" size={iconSizes.medium} variant="tertiary" />
                </ComponentWithSubIcon>
            </QuickActionButton>
        )
    );
};
