import { type ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { analyticsMock, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { ok } from '@trezor/type-utils';

import { type SuiteServices } from '../extraDependencies';

type ExtraDependenciesSuiteMock = ExtraDependenciesStatic & { services: SuiteServices };

export const extraDependenciesDesktopMock: ExtraDependenciesSuiteMock = {
    ...extraDependenciesCommonMock,
    services: {
        ...extraDependenciesCommonMock.services,
        analytics: analyticsMock, // To satisfy Suite specific type as ExtraDependenciesStatic tightness it
        suiteRouterHistory: {
            getLocation: () => ({
                pathname: '/mocked_path',
                hash: '#mocked_hash',
                search: '?mocked_search',
            }),
            navigate: (to, state) => console.warn(`Mock navigating to ${to} with state`, state),
            listen: (_: unknown) => () => {},
        },
        migrateLegacyLabelsToSuiteSync: () => Promise.resolve(ok({ changed: 0, skipped: 0 })),
    },
};
