import { atom } from 'jotai';

type OnboardingAnalytics = {
    startTimestamp: number;
    seed: 'create' | 'recovery';
    firmware: 'install' | 'update' | 'skip' | 'up-to-date';
    seedType: 'shamir-single' | 'shamir-advanced' | '12-words' | '24-words';
    recoveryStepBack: boolean;
};

export const onboardingAnalyticsAtom = atom<Partial<OnboardingAnalytics>>({});

export const updateOnboardingAnalyticsAtom = atom(
    null,
    (get, set, update: Partial<OnboardingAnalytics>) => {
        set(onboardingAnalyticsAtom, {
            ...get(onboardingAnalyticsAtom),
            ...update,
        });
    },
);

export const resetOnboardingAnalyticsAtom = atom(null, (_get, set) => {
    set(onboardingAnalyticsAtom, { startTimestamp: Date.now() });
});
