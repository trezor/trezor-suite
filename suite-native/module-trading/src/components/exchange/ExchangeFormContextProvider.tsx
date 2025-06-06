import { ReactNode } from 'react';

import { Form } from '@suite-native/forms';

import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';

export type ExchangeFormProviderProps = {
    children: ReactNode | ReactNode[];
};

export const ExchangeFormContextProvider = ({ children }: ExchangeFormProviderProps) => {
    const exchangeForm = useExchangeForm();

    return <Form form={exchangeForm}>{children}</Form>;
};
