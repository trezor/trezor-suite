import { Form } from '@suite-native/forms';

import { useSellForm } from '../../hooks/sell/useSellForm';
import { useSellFormDefaultAssets } from '../../hooks/sell/useSellFormDefaultAssets';

export type SellFormContextProviderProps = {
    children: React.ReactNode | React.ReactNode[];
};

export const SellFormContextProvider = ({ children }: SellFormContextProviderProps) => {
    const sellForm = useSellForm();
    useSellFormDefaultAssets(sellForm);

    return <Form form={sellForm}>{children}</Form>;
};
