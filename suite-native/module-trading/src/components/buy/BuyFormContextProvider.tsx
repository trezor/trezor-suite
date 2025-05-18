import { Form } from '@suite-native/forms';

import { useBuyForm } from '../../hooks/buy/useBuyForm';

export type BuyFormProviderProps = {
    children: React.ReactNode | React.ReactNode[];
};

export const BuyFormContextProvider = ({ children }: BuyFormProviderProps) => {
    const buyForm = useBuyForm();

    return <Form form={buyForm}>{children}</Form>;
};
