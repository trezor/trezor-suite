import { memo } from 'react';

import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

export const ExchangePreviewScreenHeader = memo(() => (
    <ScreenHeader
        title={<Translation id="moduleTrading.tradingExchangePreviewScreen.title" />}
        closeActionType="close"
    />
));
