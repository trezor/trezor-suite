import type { MMKV } from 'react-native-mmkv';

import { ExtraDependenciesStatic } from '@suite-common/redux-utils';
import {
    analyticsMock,
    extraDependenciesCommonMock,
    legacyAnalyticsMock,
} from '@suite-common/test-utils';
import { NativeServices } from '@suite-native/services';

type ExtraDependenciesNativeMock = ExtraDependenciesStatic & { services: NativeServices };

export const extraDependenciesNativeMock: ExtraDependenciesNativeMock = {
    ...extraDependenciesCommonMock,
    services: {
        ...extraDependenciesCommonMock.services,
        analytics: analyticsMock, // To satisfy Native specific type as ExtraDependenciesStatic tightness it
        legacyAnalytics: legacyAnalyticsMock, // To satisfy Native specific type as ExtraDependenciesStatic tightness it
        getMMKVStorage: () => Promise.resolve({} as MMKV),
    },
};
