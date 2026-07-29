import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    createSuiteNetworkModuleRepository,
    createSuiteNetworksCompositionRoot,
} from '@suite/networks';
import { formatSignedMessage, getAccountAddressesForSigning } from '@suite/sign-verify';
import { createAddressValidator } from '@suite-common/address';
import {
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';
import { type ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';
import { ok } from '@trezor/type-utils';

import { type SuiteServices } from '../extraDependencies';

type ExtraDependenciesSuiteMock = ExtraDependenciesStatic & { services: SuiteServices };

const networkModules = createNetworksCompositionRoot();
const networkModuleRepository = createNetworkModuleRepository({ networkModules });
const suiteNetworkModules = createSuiteNetworksCompositionRoot({
    trezorConnect: TrezorConnect,
    signVerifyHelpers: {
        formatSignedMessage,
        getAccountAddressesForSigning,
    },
});
const suiteNetworkModuleRepository = createSuiteNetworkModuleRepository({
    suiteNetworkModules,
});
const addressValidator = createAddressValidator({ networkModuleRepository });

export const extraDependenciesDesktopMock: ExtraDependenciesSuiteMock = {
    ...extraDependenciesCommonMock,
    services: {
        ...extraDependenciesCommonMock.services,
        networkModuleRepository,
        suiteNetworkModuleRepository,
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
