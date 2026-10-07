import { Form } from '@suite-native/forms';

import { useBuyForm } from '../../hooks/buy/useBuyForm';
import { useBuyFormDefaultAssets } from '../../hooks/buy/useBuyFormDefaultAssets';

export type BuyFormProviderProps = {
    children: React.ReactNode | React.ReactNode[];
};

export const BuyFormContextProvider = ({ children }: BuyFormProviderProps) => {
    const buyForm = useBuyForm();
    useBuyFormDefaultAssets(buyForm);

    return <Form form={buyForm}>{children}</Form>;
};
