import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createAddressValidator } from '@suite-common/address';
import {
    createGetNetworkColor,
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';
import { type ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { ok } from '@trezor/type-utils';

import { type SuiteServices, extraDependencies } from '../src/support/extraDependencies';

type ExtraDependenciesSuiteMock = ExtraDependenciesStatic & { services: SuiteServices };

const networkModules = createNetworksCompositionRoot();
const networkModuleRepository = createNetworkModuleRepository({ networkModules });
const getNetworkColor = createGetNetworkColor({ networkModuleRepository });
const addressValidator = createAddressValidator({ networkModuleRepository });

export const extraDependenciesDesktopMock: ExtraDependenciesSuiteMock = {
    ...extraDependenciesCommonMock,
    ...extraDependencies,
    services: {
        ...extraDependenciesCommonMock.services,
        networkModuleRepository,
        getNetworkColor,
        addressValidator,
        analytics: mockDesktopAnalytics(),
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
