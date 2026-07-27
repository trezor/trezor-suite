import { useEffect } from 'react';

import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { GeneralAlert } from '../../general/GeneralAlert';

export const BuyGeneralErrorScreen = () => {
    const { translate } = useTranslate();

    useEffect(() => {
        console.error('TradingBuyPreviewScreen: No quote or providerMetadata specified');
    }, []);

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <GeneralAlert text={translate('generic.unknownError')} />
        </Screen>
    );
};
