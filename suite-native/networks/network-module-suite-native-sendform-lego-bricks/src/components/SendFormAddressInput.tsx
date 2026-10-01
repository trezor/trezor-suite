import { Input } from '@suite-native/atoms';

type SendFormAddressInputProps = {
    value: string;
    onChangeText: (value: string) => void;
};

export const SendFormAddressInput = ({ value, onChangeText }: SendFormAddressInputProps) => (
    <Input
        label="Recipient address"
        accessibilityLabel="Recipient address"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
    />
);
