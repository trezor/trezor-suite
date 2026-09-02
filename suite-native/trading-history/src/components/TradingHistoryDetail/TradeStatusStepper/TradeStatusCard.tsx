import { type PropsWithChildren } from 'react';

import { Card } from '@suite-native/atoms';

export const TradeStatusCard = ({ children }: PropsWithChildren) => (
    <Card testID="@trading-history/detail/status-stepper">{children}</Card>
);
