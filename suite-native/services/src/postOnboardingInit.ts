export type PostOnboardingInit = () => void;

export type PostOnboardingInitDep = {
    postOnboardingInit: PostOnboardingInit;
};

export const injectPostOnboardingInit = (
    services: PostOnboardingInitDep,
): PostOnboardingInitDep => ({
    postOnboardingInit: services.postOnboardingInit,
});
