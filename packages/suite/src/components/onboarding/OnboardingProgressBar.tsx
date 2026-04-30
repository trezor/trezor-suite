import { useMemo } from 'react';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { BulletList, type BulletListItemState, Text } from '@trezor/components';

import { useOnboarding, useSelector } from 'src/hooks/suite';

import { stepCategories } from '../../config/onboarding/steps';
import { isStepCategoryUsed } from '../../utils/onboarding/steps';

/**
 * Returns stepCategories that have at least one currently relevant step
 * (for example Coin selection `step` is alone in its category, so the category is hidden for BTC-only onboarding)
 * */
const useOnboardingStepCategoriesInPath = () => {
    const { device } = useDevice();
    const { path: onboardingPath } = useOnboarding();
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);
    const isUnlockedBootloaderAllowed = useSelector(selectIsUnlockedBootloaderAllowed);

    return useMemo(
        () =>
            stepCategories.filter(
                stepCategory =>
                    stepCategory.labelTranslationId &&
                    isStepCategoryUsed(stepCategory, {
                        device,
                        onboardingPath,
                        isDeviceAuthenticityCheckEnabled,
                        isUnlockedBootloaderAllowed,
                    }),
            ),
        [device, onboardingPath, isDeviceAuthenticityCheckEnabled, isUnlockedBootloaderAllowed],
    );
};

const getState = (index: number, indexOfActiveStep: number): BulletListItemState => {
    // When active category is not in the visible list (e.g. final step), all visible steps are done.
    if (indexOfActiveStep === -1) return 'done';
    if (index < indexOfActiveStep) return 'done';
    if (index === indexOfActiveStep) return 'default';

    return 'pending';
};

export const OnboardingProgressBar = () => {
    const stepCategoriesInPath = useOnboardingStepCategoriesInPath();
    const { activeStepCategory } = useOnboarding();
    const indexOfActiveStep = stepCategoriesInPath.findIndex(
        ({ id }) => id === activeStepCategory?.id,
    );

    return (
        <BulletList
            direction="horizontal"
            isOrdered
            bulletGap={16}
            margin={{ horizontal: 24 }}
            lineWidth={1}
        >
            {stepCategoriesInPath.map(({ id, labelTranslationId }, index) => (
                <BulletList.Item
                    key={id}
                    title={
                        <Text typographyStyle="body-xs">
                            <Translation id={labelTranslationId as TranslationKey} />
                        </Text>
                    }
                    state={getState(index, indexOfActiveStep)}
                />
            ))}
        </BulletList>
    );
};
