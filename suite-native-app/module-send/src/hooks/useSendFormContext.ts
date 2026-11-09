import { type UseFormReturn, useFormContext } from '@suite-native/forms';

import { type SendAmountConversion } from '../createSendAmountConversion';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';

/**
 * useSendForm adds prefillAmount and updateFiatAmount to the form passed to Form,
 * but the generic useFormContext type exposes only standard form methods. This
 * wrapper centralizes the type assertion so send components can share those
 * conversion methods without repeating the cast.
 */
export const useSendFormContext = () =>
    useFormContext<SendOutputsFormValues>() as UseFormReturn<SendOutputsFormValues> &
        SendAmountConversion;
