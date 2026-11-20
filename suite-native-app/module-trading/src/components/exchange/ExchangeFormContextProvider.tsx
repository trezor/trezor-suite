import { type ReactNode } from 'react';

import { TokenMetadataProvider } from '@suite-common/token';
import { Form, useWatch } from '@suite-native/forms';

import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';
import { useExchangeFormDefaultAssets } from '../../hooks/exchange/useExchangeFormDefaultAssets';
import { tradeableAssetsToTokenMetadataSources } from '../../utils/general/tradeableAssetsToTokenMetadataSources';

export type ExchangeFormProviderProps = {
    children: ReactNode | ReactNode[];
};

export const ExchangeFormContextProvider = ({ children }: ExchangeFormProviderProps) => {
    const exchangeForm = useExchangeForm();
    const [sendAsset, receiveAsset] = useWatch({
        control: exchangeForm.control,
        name: ['sendAsset', 'receiveAsset'],
    });
    useExchangeFormDefaultAssets(exchangeForm);

    return (
        <TokenMetadataProvider
            sources={tradeableAssetsToTokenMetadataSources([receiveAsset, sendAsset])}
        >
            <Form form={exchangeForm}>{children}</Form>
        </TokenMetadataProvider>
    );
};
