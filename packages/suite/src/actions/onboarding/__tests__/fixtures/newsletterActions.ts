import * as newsletterActions from '@onboarding-actions/newsletterActions';

export const fixtures = [
    {
        description: 'Set email field',
        actions: [() => newsletterActions.setEmail('email@bcash.lol')],
        result: [
            {
                email: 'email@bcash.lol',
            },
        ],
    },
    {
        description: 'Set skipped field',
        actions: [() => newsletterActions.setSkipped()],
        result: [
            {
                skipped: true,
            },
        ],
    },
    {
        description: 'Toggle checkbox field',
        actions: [() => newsletterActions.toggleCheckbox('Security updates')],
        result: [
            {
                checkboxes: [
                    { value: false, label: 'Security updates' },
                    { value: true, label: 'Product updates' },
                    { value: true, label: 'Special offers' },
                    { value: true, label: 'Educational content' },
                    { value: true, label: 'Tech & Dev corner' },
                ],
            },
        ],
    },
];
