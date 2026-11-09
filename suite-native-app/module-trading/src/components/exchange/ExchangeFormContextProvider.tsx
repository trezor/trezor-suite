import { type ReactNode } from 'react';

import { Form } from '@suite-native/forms';

import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';
import { useExchangeFormDefaultAssets } from '../../hooks/exchange/useExchangeFormDefaultAssets';

export type ExchangeFormProviderProps = {
    children: ReactNode | ReactNode[];
};

export const ExchangeFormContextProvider = ({ children }: ExchangeFormProviderProps) => {
    const exchangeForm = useExchangeForm();
    useExchangeFormDefaultAssets(exchangeForm);

    return <Form form={exchangeForm}>{children}</Form>;
};
