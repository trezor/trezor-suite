import { AnyStepId, AnyPath, Step } from 'src/types/onboarding';
// types types types

export const isStepInPath = (step: Step, path: AnyPath[]) => {
    if (!step.path) {
        return true;
    }
    if (path.length === 0) {
        return true;
    }
    return path.every((pathMember: AnyPath) =>
        // @ts-expect-error
        step.path.some((stepPathMember: AnyPath) => stepPathMember === pathMember),
    );
};

export const findNextStep = (currentStepId: AnyStepId, steps: Step[]) => {
    const currentIndex = steps.findIndex((step: Step) => step.id === currentStepId);
    if (!steps[currentIndex + 1]) {
        throw new Error('no next step exists');
    }
    return steps[currentIndex + 1];
};

export const findPrevStep = (currentStepId: AnyStepId, steps: Step[]) => {
    const currentIndex = steps.findIndex((step: Step) => step.id === currentStepId);
    if (!steps[currentIndex - 1]) {
        throw new Error('no prev step exists');
    }
    return steps[currentIndex - 1];
};
