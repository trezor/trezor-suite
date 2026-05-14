import { type ReactNode } from 'react';

import { Text } from '@suite-native/atoms';

import { TradeInfoRow } from './TradeInfoRow';

type TradeInfoHeaderProps = {
    title: ReactNode;
    rightContent?: ReactNode;
};

export const TradeInfoHeader = ({ title, rightContent }: TradeInfoHeaderProps) => (
    <TradeInfoRow noBorder>
        <Text variant="body-sm">{title}</Text>
        {rightContent}
    </TradeInfoRow>
);
