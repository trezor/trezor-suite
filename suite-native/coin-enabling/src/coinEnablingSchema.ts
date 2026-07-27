import { yup } from '@suite-common/validators';

import { type EnabledCoins } from './coinEnablingFormUtils';

export const coinEnablingFormValidationSchema = yup.object({
    enabledCoins: yup
        .object()
        .test('has-enabled-network', (value: EnabledCoins | undefined) =>
            Object.values(value ?? {}).some(Boolean),
        ),
});
