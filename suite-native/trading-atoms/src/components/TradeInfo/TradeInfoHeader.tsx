import { type ReactNode } from 'react';

import { Text } from '@suite-native/atoms';

import { TradeInfoRow } from './TradeInfoRow';

type TradeInfoHeaderProps = {
    title: ReactNode;
    rightContent?: ReactNode;
    testID?: string;
};

export const TradeInfoHeader = ({ title, rightContent, testID }: TradeInfoHeaderProps) => (
    <TradeInfoRow noBorder>
        <Text variant="body-sm" color="contentSecondary" testID={testID}>
            {title}
        </Text>
        {rightContent}
    </TradeInfoRow>
);
