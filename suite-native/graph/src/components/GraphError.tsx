import { Text, VStack } from '@suite-native/atoms';

type GraphErrorProps = {
    error: string;
    onTryAgain: () => void;
};

export const GraphError = ({ error, onTryAgain }: GraphErrorProps) => (
    <VStack spacing="small" alignItems="center">
        <Text variant="label" color="textSubdued" align="center">
            There are some troubles with loading graph points: {error}
        </Text>
        <Text variant="body" color="textSecondaryHighlight" align="center" onPress={onTryAgain}>
            Try again
        </Text>
    </VStack>
);
