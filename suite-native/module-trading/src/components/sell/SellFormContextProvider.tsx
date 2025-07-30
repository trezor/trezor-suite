import { Form } from '@suite-native/forms';

import { useSellForm } from '../../hooks/sell/useSellForm';

export type SellFormContextProviderProps = {
    children: React.ReactNode | React.ReactNode[];
};

export const SellFormContextProvider = ({ children }: SellFormContextProviderProps) => {
    const sellForm = useSellForm();

    return <Form form={sellForm}>{children}</Form>;
};
