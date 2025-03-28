import { Form } from '@suite-native/forms';

import { useTradingBuyForm } from '../../hooks/useTradingBuyForm';

export type BuyFormProviderProps = {
    children: React.ReactNode | React.ReactNode[];
};

export const BuyFormContextProvider = ({ children }: BuyFormProviderProps) => {
    const buyForm = useTradingBuyForm();

    return <Form form={buyForm}>{children}</Form>;
};
