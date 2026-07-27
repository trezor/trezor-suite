import type { MMKV } from 'react-native-mmkv';

import type { ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import type { NativeServices } from '@suite-native/services';

type ExtraDependenciesNativeMock = ExtraDependenciesStatic & { services: NativeServices };

export const extraDependenciesNativeMock: ExtraDependenciesNativeMock = {
    ...extraDependenciesCommonMock,
    services: {
        ...extraDependenciesCommonMock.services,
        analytics: mockNativeAnalytics(),
        getMMKVStorage: () => Promise.resolve({} as MMKV),
    },
};
