import { useFormContext } from '@suite-native/forms';
import { NumPadButton } from '@suite-native/atoms';

type PinItemProps = {
    value: number; // or string?
};

export const PinMatrixButton = ({ value }: PinItemProps) => {
    const { setValue, getValues } = useFormContext();

    const handlePress = () => {
        const pin = getValues('pin');

        if (pin.length === 50) {
            // TODO we need to display some error message / set form error
            return;
        }

        setValue('pin', pin.concat(value));
    };

    return <NumPadButton onPress={handlePress} value={value} />;
};
