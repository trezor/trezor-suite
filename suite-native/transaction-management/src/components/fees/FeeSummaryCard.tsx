import { Platform } from 'react-native';
import { FadeIn, FadeOut, StretchInY, StretchOutY } from 'react-native-reanimated';

import { AnimatedPressable, Card } from '@suite-native/atoms';

import { FeeSummaryRow, type FeeSummaryRowProps } from './FeeSummaryRow';

export type FeeSummaryCardProps = FeeSummaryRowProps & {
    onPress?: () => void;
    testID?: string;
};

export const FeeSummaryCard = ({ onPress, testID, ...rowProps }: FeeSummaryCardProps) => (
    <AnimatedPressable
        entering={Platform.OS === 'android' ? StretchInY : FadeIn}
        exiting={Platform.OS === 'android' ? StretchOutY : FadeOut}
        onPress={onPress}
        testID={testID}
    >
        <Card noPadding>
            <FeeSummaryRow {...rowProps} />
        </Card>
    </AnimatedPressable>
);
