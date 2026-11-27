import { Column, Divider } from '@trezor/components';
import { QuestionIcon } from '@trezor/icons';
import {
    OnboardingStepper,
    selectIsOnboardingDeviceDisconnected,
    useGuide,
    useOnboarding,
    useResponsiveContext,
    useSelector,
} from '@trezor/suite';

import { NavigationItem } from './NavigationItem';
import { SettingsNavigationItem } from './SettingsNavigationItem';
import { Sidebar } from './Sidebar';

export const OnboardingSidebar = () => {
    const { openGuide } = useGuide();
    const { isActive } = useOnboarding();
    const isDeviceDisconnected = useSelector(selectIsOnboardingDeviceDisconnected);
    const { isSidebarCollapsed } = useResponsiveContext();

    if (isDeviceDisconnected) {
        return <Sidebar />;
    }

    return (
        <Sidebar isDeviceSelectorInteractive={false}>
            <Column flex="1" overflow="auto">
                {isActive && <OnboardingStepper />}
            </Column>
            <Divider margin={0} color="surfaceBorderSunken" />
            <Column
                alignItems={isSidebarCollapsed ? 'center' : 'stretch'}
                gap={4}
                margin={8}
                flex="0 0 auto"
                data-testid="@suite/menu/bottom-navigation"
            >
                <SettingsNavigationItem />
                <NavigationItem
                    nameId="TR_GUIDE_HELP_AND_SUPPORT"
                    icon={QuestionIcon}
                    onClick={openGuide}
                    shortcut={['F1']}
                    data-testid="@guide/button-open"
                />
            </Column>
        </Sidebar>
    );
};
