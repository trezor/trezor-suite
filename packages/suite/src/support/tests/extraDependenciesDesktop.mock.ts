import { ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { analyticsMock, extraDependenciesCommonMock } from '@suite-common/test-utils';
import SuiteDB from '@trezor/suite-storage';

import type { SuiteDBSchema } from '../../storage/definitions';
import { SuiteServices } from '../extraDependencies';

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
            listen: (_: {}) => () => {},
        },
        disableLegacyMetadataIfNeeded: () => {},
        // Todo: introduce proper interface with just few methods to make mocking easy
        //       and se do not depend on implementation details.
        db: {} as SuiteDB<SuiteDBSchema>,
    },
};
