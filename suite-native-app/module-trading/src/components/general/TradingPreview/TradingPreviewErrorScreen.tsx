import { useEffect } from 'react';

import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { GeneralAlert } from '../GeneralAlert';

export type TradingPreviewErrorScreenProps = {
    screenName: string;
};

export const TradingPreviewErrorScreen = ({ screenName }: TradingPreviewErrorScreenProps) => {
    const { translate } = useTranslate();

    useEffect(() => {
        console.error(`${screenName}: No quote or providerMetadata specified`);
    }, [screenName]);

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <GeneralAlert text={translate('generic.unknownError')} />
        </Screen>
    );
};
