import { memo } from 'react';

import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

export const SellPreviewScreenHeader = memo(() => (
    <ScreenHeader
        title={<Translation id="moduleTrading.tradingSellPreviewScreen.title" />}
        closeActionType="close"
    />
));
