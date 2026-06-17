import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedPressable, Card } from '@suite-native/atoms';

import { FeeSummaryRow, type FeeSummaryRowProps } from './FeeSummaryRow';

export type FeeSummaryCardProps = FeeSummaryRowProps & {
    onPress?: () => void;
    testID?: string;
};

// TODO android animations
export const FeeSummaryCard = ({ onPress, testID, ...rowProps }: FeeSummaryCardProps) => (
    <AnimatedPressable exiting={FadeOut} entering={FadeIn} onPress={onPress} testID={testID}>
        <Card noPadding>
            <FeeSummaryRow {...rowProps} />
        </Card>
    </AnimatedPressable>
);
