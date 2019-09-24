import * as onboardingActions from '@onboarding-actions/onboardingActions';
import onboardingReducer from '@onboarding-reducers/onboardingReducer';

export default [
    {
        description: 'goToNextStep (without param)',
        initialState: {},
        action: () => onboardingActions.goToNextStep(),
        expect: {
            toMatchObject: { activeStepId: 'new-or-used' },
        },
    },
    {
        description: 'goToNextStep (with param)',
        initialState: {},
        action: () => onboardingActions.goToNextStep('firmware'),
        expect: {
            toMatchObject: { activeStepId: 'firmware' },
        },
    },
    {
        description: 'goToSubStep',
        initialState: {},
        action: () => onboardingActions.goToSubStep('moo'),
        expect: {
            toMatchObject: { activeSubStep: 'moo' },
        },
    },
    {
        description: 'goToPreviousStep',
        initialState: {
            activeStepId: 'new-or-used',
        },
        action: () => onboardingActions.goToPreviousStep(),
        expect: {
            toMatchObject: { activeStepId: 'welcome' },
        },
    },
    {
        description: 'addPath: should add unique entry',
        initialState: {
            path: ['new'],
        },
        action: () => onboardingActions.addPath('create'),
        expect: {
            toMatchObject: { path: ['new', 'create'] },
        },
    },
    {
        description: 'addPath: should add duplicit entry',
        initialState: {
            path: ['new'],
        },
        action: () => onboardingActions.addPath('new'),
        expect: {
            toMatchObject: { path: ['new'] },
        },
    },
    {
        description: 'removePath: one element',
        initialState: {
            path: ['create', 'new'],
        },
        action: () => onboardingActions.removePath(['create']),
        expect: {
            toMatchObject: { path: ['new'] },
        },
    },
    {
        description: 'removePath: multiple elements',
        initialState: {
            path: ['create', 'new'],
        },
        action: () => onboardingActions.removePath(['create', 'new']),
        expect: {
            toMatchObject: { path: [] },
        },
    },
    {
        description: 'selectTrezorModel',
        initialState: {
            selectModel: 1,
        },
        action: () => onboardingActions.selectTrezorModel(2),
        expect: {
            toMatchObject: { selectedModel: 2 },
        },
    },
    {
        description: 'resetOnboarding: should set onboarding reducer to initial state',
        initialState: {
            path: ['create', 'new', 'used'],
            activeStepId: 'recovery',
        },
        action: () => onboardingActions.resetOnboarding(),
        expect: {
            toMatchObject: onboardingReducer(undefined, { type: 'foo' } as any),
        },
    },
];
