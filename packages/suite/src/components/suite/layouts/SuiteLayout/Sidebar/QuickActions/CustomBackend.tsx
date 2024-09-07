import { useTheme } from 'styled-components';
import { useTranslation } from '../../../../../../hooks/suite';
import { useEnabledBackends } from '../../utils';
import { ComponentWithSubIcon, Icon, iconSizes } from '@trezor/components';
import { NavBackends } from './NavBackends';
import { QuickActionButton } from './QuickActionButton';

export const CustomBackend = () => {
    const theme = useTheme();
    const { translationString } = useTranslation();

    const enabledBackends = useEnabledBackends();
    const isCustomBackendIconVisible = enabledBackends.length > 0;

    return (
        isCustomBackendIconVisible && (
            <NavBackends customBackends={enabledBackends}>
                <QuickActionButton tooltip={translationString('TR_CUSTOM_BACKEND')}>
                    <ComponentWithSubIcon
                        variant="primary"
                        subIconProps={{
                            name: 'check',
                            color: theme['iconDefaultInverted'],
                            size: iconSizes.extraSmall,
                        }}
                    >
                        <Icon name="backend" size={iconSizes.medium} variant="tertiary" />
                    </ComponentWithSubIcon>
                </QuickActionButton>
            </NavBackends>
        )
    );
};
