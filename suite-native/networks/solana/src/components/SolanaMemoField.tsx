import { Input, Text, VStack } from '@suite-native/atoms';
import type { NativeSendFieldProps } from '@suite-native/network-module-suite-native-types';

export const SolanaMemoField = ({ value, onChange, error }: NativeSendFieldProps) => (
    <VStack spacing={4}>
        <Input
            label="Memo"
            accessibilityLabel="Memo"
            value={value}
            onChangeText={onChange}
            hasError={error !== undefined}
            autoCapitalize="none"
            autoCorrect={false}
        />
        {error === 'too-long' && <Text color="contentCritical">Memo is too long.</Text>}
    </VStack>
);
