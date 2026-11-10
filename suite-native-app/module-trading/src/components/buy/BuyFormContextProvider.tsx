import { TokenMetadataProvider } from '@suite-common/token';
import { Form, useWatch } from '@suite-native/forms';

import { useBuyForm } from '../../hooks/buy/useBuyForm';
import { useBuyFormDefaultAssets } from '../../hooks/buy/useBuyFormDefaultAssets';
import { tradeableAssetsToTokenMetadataSources } from '../../utils/general/tradeableAssetsToTokenMetadataSources';

export type BuyFormProviderProps = {
    children: React.ReactNode | React.ReactNode[];
};

export const BuyFormContextProvider = ({ children }: BuyFormProviderProps) => {
    const buyForm = useBuyForm();
    const asset = useWatch({ control: buyForm.control, name: 'asset' });
    useBuyFormDefaultAssets(buyForm);

    return (
        <TokenMetadataProvider sources={tradeableAssetsToTokenMetadataSources([asset])}>
            <Form form={buyForm}>{children}</Form>
        </TokenMetadataProvider>
    );
};
