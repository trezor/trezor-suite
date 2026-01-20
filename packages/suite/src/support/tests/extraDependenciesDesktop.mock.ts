import { ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils';

import { SuiteServices } from '../extraDependencies';

type ExtraDependenciesSuiteMock = ExtraDependenciesStatic & { services: SuiteServices };

export const extraDependenciesDesktopMock: ExtraDependenciesSuiteMock = {
    ...extraDependenciesMock,
    services: {
        ...extraDependenciesMock.services,
        disableLegacyMetadataIfNeeded: () => {},
    },
};
