import { Form, useWatch } from '@suite-native/forms';

import { useSellForm } from '../../hooks/sell/useSellForm';
import { useSellFormDefaultAssets } from '../../hooks/sell/useSellFormDefaultAssets';
import { TradeableAssetMetadataProvider } from '../general/TradeableAssetMetadataProvider';

export type SellFormContextProviderProps = {
    children: React.ReactNode | React.ReactNode[];
};

export const SellFormContextProvider = ({ children }: SellFormContextProviderProps) => {
    const sellForm = useSellForm();
    const sendAsset = useWatch({ control: sellForm.control, name: 'sendAsset' });
    useSellFormDefaultAssets(sellForm);

    return (
        <TradeableAssetMetadataProvider assets={[sendAsset]}>
            <Form form={sellForm}>{children}</Form>
        </TradeableAssetMetadataProvider>
    );
};
