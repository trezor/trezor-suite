import { useEffect, useEffectEvent, useState } from 'react';

import { STEPPER_FILL_MS, STEPPER_RESIZE_MS } from './animationTimings';
import { type OnboardingProgress } from './getOnboardingProgress';

type StepCategory = keyof OnboardingProgress;

type StepperAnimation = {
    progress: OnboardingProgress;
    activeCategory: StepCategory | null;
    fillDelayMs: number;
    completionEndsAt?: number;
};

type UseOnboardingStepperAnimationParams = {
    progress: OnboardingProgress | undefined;
    shouldReduceMotion: boolean;
};

const getActiveCategory = ({ device, wallet, pin }: OnboardingProgress): StepCategory | null => {
    if (device > 0 && device < 1) return 'device';
    if (wallet > 0 && wallet < 1) return 'wallet';
    if (pin > 0 && pin < 1) return 'pin';

    return null;
};

export const useOnboardingStepperAnimation = ({
    progress,
    shouldReduceMotion,
}: UseOnboardingStepperAnimationParams): StepperAnimation => {
    const [animation, setAnimation] = useState<StepperAnimation>(() => {
        const initialProgress = progress ?? { device: 0, wallet: 0, pin: 0 };

        return {
            progress: initialProgress,
            activeCategory: getActiveCategory(initialProgress),
            fillDelayMs: 0,
        };
    });
    const device = progress?.device;
    const wallet = progress?.wallet;
    const pin = progress?.pin;

    const animateTo = useEffectEvent((nextProgress: OnboardingProgress) => {
        const activeCategory = getActiveCategory(nextProgress);

        if (
            animation.progress.device === nextProgress.device &&
            animation.progress.wallet === nextProgress.wallet &&
            animation.progress.pin === nextProgress.pin &&
            animation.activeCategory === activeCategory
        ) {
            return;
        }

        const isCategoryChanging = animation.activeCategory !== activeCategory;
        const next: StepperAnimation = {
            progress: nextProgress,
            activeCategory,
            fillDelayMs: isCategoryChanging && !shouldReduceMotion ? STEPPER_RESIZE_MS : 0,
        };

        if (isCategoryChanging && animation.activeCategory && !shouldReduceMotion) {
            const completionEndsAt = animation.completionEndsAt ?? Date.now() + STEPPER_FILL_MS;
            const remainingMs = Math.max(0, completionEndsAt - Date.now());

            setAnimation({
                ...animation,
                progress: {
                    ...animation.progress,
                    [animation.activeCategory]: nextProgress[animation.activeCategory],
                },
                fillDelayMs: 0,
                completionEndsAt,
            });

            return setTimeout(() => setAnimation(next), remainingMs);
        }

        setAnimation(next);
    });

    useEffect(() => {
        // Preserve progress while device information is temporarily unavailable.
        if (device === undefined || wallet === undefined || pin === undefined) return;

        const completionTimeout = animateTo({ device, wallet, pin });

        return () => {
            clearTimeout(completionTimeout);
        };
    }, [device, wallet, pin, shouldReduceMotion]);

    return animation;
};
