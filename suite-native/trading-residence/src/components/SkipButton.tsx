import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type SkipButtonProps = {
    onPress: () => void;
};

export const SkipButton = ({ onPress }: SkipButtonProps) => (
    <Button colorScheme="tertiaryElevation0" size="large" onPress={onPress}>
        <Translation id="tradingResidence.locationSettings.skipButton" />
    </Button>
);
