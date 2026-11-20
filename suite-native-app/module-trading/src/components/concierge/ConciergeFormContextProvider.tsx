import { type PropsWithChildren } from 'react';

import { type TradingCountryCode } from '@suite-common/trading';
import { Form } from '@suite-native/forms';

import { useConciergeForm } from '../../hooks/concierge/useConciergeForm';

export type ConciergeFormContextProviderProps = {
    defaultCountryCode?: TradingCountryCode;
};

export const ConciergeFormContextProvider = ({
    defaultCountryCode,
    children,
}: PropsWithChildren<ConciergeFormContextProviderProps>) => {
    const conciergeForm = useConciergeForm({ defaultCountryCode });

    return <Form form={conciergeForm}>{children}</Form>;
};
