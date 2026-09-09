import { type WithServices } from '@suite-common/redux-utils';

import { createTestCompositionRoot } from './createTestCompositionRoot';

type RequiredExtra = WithServices<{
    formatValue: (value: number) => string;
}>;

const formatValue = (value: number) => value.toString();

// Extra can be omitted when no services are required.
createTestCompositionRoot({});

// Provide the required service.
createTestCompositionRoot<RequiredExtra>({
    extra: { services: { formatValue } },
});

// @ts-expect-error Required dependencies cannot be omitted.
createTestCompositionRoot<RequiredExtra>({});

createTestCompositionRoot<RequiredExtra>({
    // @ts-expect-error Empty services do not include the required service.
    extra: { services: {} },
});
