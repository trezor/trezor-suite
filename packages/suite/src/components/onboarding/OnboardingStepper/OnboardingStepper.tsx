import { useSelector } from 'react-redux';

import { useReducedMotion } from 'framer-motion';

import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { Column } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

import { stepCategories } from '#src/config/onboarding/steps';
import {
    selectOnboardingActiveStepId,
    selectOnboardingPath,
} from '#src/selectors/onboarding/onboardingSelectors';
import { useResponsiveContext } from '#src/support/suite/ResponsiveContext';

import { OnboardingStepperItem } from './OnboardingStepperItem';
import { getOnboardingProgress } from './getOnboardingProgress';
import { useOnboardingStepperAnimation } from './useOnboardingStepperAnimation';

const steps = stepCategories.flatMap(category =>
    category.id !== 'final' && category.labelTranslationId !== undefined
        ? [{ id: category.id, label: category.labelTranslationId }]
        : [],
);

export const OnboardingStepper = () => {
    const activeStepId = useSelector(selectOnboardingActiveStepId);
    const device = useSelector(selectSelectedDevice);
    const onboardingPath = useSelector(selectOnboardingPath);
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);
    const isUnlockedBootloaderAllowed = useSelector(selectIsUnlockedBootloaderAllowed);
    const { isSidebarCollapsed } = useResponsiveContext();
    const shouldReduceMotion = useReducedMotion() === true;
    const targetProgress =
        device?.features?.internal_model &&
        device.features.internal_model !== DeviceModelInternal.UNKNOWN
            ? getOnboardingProgress({
                  activeStepId,
                  device,
                  onboardingPath,
                  isDeviceAuthenticityCheckEnabled,
                  isUnlockedBootloaderAllowed,
              })
            : undefined;
    const { progress, activeCategory, fillDelayMs } = useOnboardingStepperAnimation({
        progress: targetProgress,
        shouldReduceMotion,
    });

    return (
        <Column
            as="ol"
            padding={16}
            alignItems={isSidebarCollapsed ? 'center' : 'stretch'}
            data-testid="@onboarding/stepper"
        >
            {steps.map(({ id, label }, index) => (
                <OnboardingStepperItem
                    key={id}
                    id={id}
                    label={label}
                    progress={progress[id]}
                    isActive={activeCategory === id}
                    fillDelayMs={fillDelayMs}
                    isCollapsed={isSidebarCollapsed}
                    isLast={index === steps.length - 1}
                />
            ))}
        </Column>
    );
};
