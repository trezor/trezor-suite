import { ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils';

import { SuiteServices } from '../extraDependencies';

type ExtraDependenciesSuiteMock = ExtraDependenciesStatic & { services: SuiteServices };

export const extraDependenciesDesktopMock: ExtraDependenciesSuiteMock = {
    ...extraDependenciesMock,
    services: {
        ...extraDependenciesMock.services,
        suiteRouterHistory: {
            getLocation: () => ({
                pathname: '/mocked_path',
                hash: '#mocked_hash',
                search: '?mocked_search',
            }),
            navigate: (to, state) => console.warn(`Mock navigating to ${to} with state`, state),
            listen: (_: {}) => () => {},
        },

        disableLegacyMetadataIfNeeded: () => {},
    },
};
