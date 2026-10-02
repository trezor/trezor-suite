import { yup } from '@suite-native/forms';

import { type EnabledCoins } from './coinEnablingFormUtils';

export const coinEnablingFormValidationSchema = yup.object({
    enabledCoins: yup
        .object()
        .test('has-enabled-network', (value: EnabledCoins | undefined) =>
            Object.values(value ?? {}).some(Boolean),
        ),
});
