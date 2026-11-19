import { exhaustive } from '@trezor/type-utils';

import { stepCategories } from '#src/config/onboarding/steps';
import { type AnyStepId } from '#src/types/onboarding';
import { type IsStepUsedProps, isStepUsed } from '#src/utils/onboarding/steps';

export type OnboardingProgress = {
    device: number;
    wallet: number;
    pin: number;
};

type GetOnboardingProgressParams = IsStepUsedProps & {
    activeStepId: AnyStepId;
};

const deviceSteps = stepCategories.flatMap(category =>
    category.id === 'device' ? category.steps : [],
);

export const getOnboardingProgress = (props: GetOnboardingProgressParams): OnboardingProgress => {
    const { activeStepId } = props;
    switch (activeStepId) {
        case 'security-check':
        case 'firmware':
        case 'authenticate-device':
        case 'tutorial': {
            // Installing firmware can enable version-gated steps. Plan them by model while
            // firmware is missing, so installation does not increase the denominator.
            const plannedSteps =
                props.device?.firmware === 'none'
                    ? deviceSteps.map(step => ({
                          ...step,
                          supportedModels: step.supportedModels?.map(model =>
                              typeof model === 'object' ? model.model : model,
                          ),
                      }))
                    : deviceSteps;
            const activeIndex = plannedSteps.findIndex(step => step.id === activeStepId);
            const availableSteps = plannedSteps.filter(step => isStepUsed(step, props));
            const reachedSteps = plannedSteps
                .slice(0, activeIndex + 1)
                .filter(step => isStepUsed(step, props));

            return { device: reachedSteps.length / (availableSteps.length + 1), wallet: 0, pin: 0 };
        }
        case 'create-or-recover':
        case 'backup-type':
            return { device: 1, wallet: 1 / 3, pin: 0 };
        case 'security':
        case 'recovery':
            return { device: 1, wallet: 2 / 3, pin: 0 };
        case 'set-pin':
            return { device: 1, wallet: 1, pin: 1 / 2 };
        case 'final':
            return { device: 1, wallet: 1, pin: 1 };
        default:
            return exhaustive(activeStepId);
    }
};
