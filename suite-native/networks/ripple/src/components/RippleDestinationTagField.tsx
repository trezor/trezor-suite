import { Input, Text, VStack } from '@suite-native/atoms';
import type { NativeSendFieldProps } from '@suite-native/network-module-suite-native-types';

const errorMessage = {
    'not-a-number': 'Destination tag must be a whole number.',
    'out-of-range': 'Destination tag is too large.',
    'too-long': 'Destination tag is too long.',
} as const;

export const RippleDestinationTagField = ({ value, onChange, error }: NativeSendFieldProps) => (
    <VStack spacing={4}>
        <Input
            label="Destination tag"
            accessibilityLabel="Destination tag"
            value={value}
            onChangeText={onChange}
            hasError={error !== undefined}
            keyboardType="number-pad"
        />
        {error && <Text color="contentCritical">{errorMessage[error]}</Text>}
    </VStack>
);
