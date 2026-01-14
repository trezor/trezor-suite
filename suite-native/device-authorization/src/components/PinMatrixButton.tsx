import { formInputsMaxLength } from '@suite-common/validators';
import { NumPadButton } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';

type PinItemProps = {
    value: number;
};

export const PinMatrixButton = ({ value }: PinItemProps) => {
    const { setValue, watch, getValues } = useFormContext();

    const pinLength = watch('pin').length;

    const handlePress = () => {
        const pin = getValues('pin');
        setValue('pin', pin.concat(value));
    };

    return (
        <NumPadButton
            disabled={pinLength === formInputsMaxLength.pin}
            onPress={handlePress}
            value={value}
        />
    );
};
