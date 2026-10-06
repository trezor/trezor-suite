import { type RouterRootState } from '@suite/router';
import { createRouterStateMock } from '@suite/router/mocks';

import { selectShouldRouterAppSkipAuthenticityCheck } from './authenticityChecksSelectors';

type Fixture = {
    description: string;
    state: RouterRootState;
    result: boolean;
};

const fixtures: Fixture[] = [
    {
        description: 'returns false for a router app that should not be skipped',
        state: {
            router: createRouterStateMock({
                app: 'dashboard',
            }),
        },
        result: false,
    },
    {
        description: 'returns true for a router app that should be skipped',
        state: {
            router: createRouterStateMock({
                app: 'settings',
            }),
        },
        result: true,
    },
];

describe(selectShouldRouterAppSkipAuthenticityCheck.name, () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            expect(selectShouldRouterAppSkipAuthenticityCheck(f.state)).toBe(f.result);
        });
    });
});
