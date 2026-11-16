import { selectRouterApp } from '@suite/router';
import { Column, Divider } from '@trezor/components';
import { QuestionIcon } from '@trezor/icons';
import { OnboardingStepper, useGuide, useOnboarding, useSelector } from '@trezor/suite';

import { NavigationItem } from './NavigationItem';
import { Sidebar } from './Sidebar';

export const OnboardingSidebar = () => {
    const { openGuide } = useGuide();
    const { isActive } = useOnboarding();
    const isOnboardingRoute = useSelector(selectRouterApp) === 'onboarding';

    return (
        <Sidebar isDeviceSelectorInteractive={false}>
            <Column flex="1" overflow="auto">
                {isActive && isOnboardingRoute && <OnboardingStepper />}
            </Column>
            <Divider margin={0} color="surfaceBorderSunken" />
            <Column margin={8} flex="0 0 auto">
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
