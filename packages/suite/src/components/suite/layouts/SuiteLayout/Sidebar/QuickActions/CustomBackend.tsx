import { useTheme } from 'styled-components';

import { ComponentWithSubIcon, Icon, iconSizes } from '@trezor/components';

import { NavBackends } from './NavBackends';
import { QuickActionButton } from './QuickActionButton';
import { useTranslation } from '../../../../../../hooks/suite';
import { useEnabledBackends } from '../../utils';

export const CustomBackend = () => {
    const theme = useTheme();
    const { translationString } = useTranslation();

    const enabledBackends = useEnabledBackends();
    const isCustomBackendIconVisible = enabledBackends.length > 0;

    return (
        isCustomBackendIconVisible && (
            <NavBackends customBackends={enabledBackends}>
                <QuickActionButton tooltip={{ content: translationString('TR_CUSTOM_BACKEND') }}>
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
            </NavBackends>
        )
    );
};
