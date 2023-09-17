import { HStack, Text } from '@suite-native/atoms';

type PinProgressProps = {
    pinLength: number;
};

export const PinProgress = ({ pinLength }: PinProgressProps) => {
    if (!pinLength) return <Text variant="titleSmall">Enter PIN</Text>;

    if (pinLength > 4) return <Text>You have entered {pinLength}</Text>;

    const progress = [...Array(pinLength).keys()];

    return (
        <HStack justifyContent="center">
            {progress.map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Text key={index}>.</Text>
            ))}
        </HStack>
    );
};
