import { AnyStepId, AnyPath, Step } from '@onboarding-types/steps';
// types types types

export const isStepInPath = (step: Step, path: AnyPath[]) => {
    if (!step.path) {
        return true;
    }
    if (path.length === 0) {
        return true;
    }
    return path.every((pathMember: AnyPath) => {
        // @ts-ignore
        return step.path.some((stepPathMember: AnyPath) => stepPathMember === pathMember);
    });
};

export const findNextStep = (currentStepId: AnyStepId, steps: Step[]) => {
    const currentIndex = steps.findIndex((step: Step) => step.id === currentStepId);
    if (currentIndex + 1 > steps.length) {
        throw new Error('no next step exists');
    }
    return steps[currentIndex + 1];
};

export const findPrevStep = (currentStepId: AnyStepId, steps: Step[]) => {
    const currentIndex = steps.findIndex((step: Step) => step.id === currentStepId);
    if (currentIndex - 1 > steps.length) {
        throw new Error('no next step exists');
    }
    return steps[currentIndex - 1];
};
