import { type ReactNode } from 'react';

import { Form, useWatch } from '@suite-native/forms';

import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';
import { useExchangeFormDefaultAssets } from '../../hooks/exchange/useExchangeFormDefaultAssets';
import { TradeableAssetMetadataProvider } from '../general/TradeableAssetMetadataProvider';

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
        <TradeableAssetMetadataProvider asset={sendAsset}>
            <TradeableAssetMetadataProvider asset={receiveAsset}>
                <Form form={exchangeForm}>{children}</Form>
            </TradeableAssetMetadataProvider>
        </TradeableAssetMetadataProvider>
    );
};
