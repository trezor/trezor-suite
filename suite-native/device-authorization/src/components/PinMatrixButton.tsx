import { formInputsMaxLength } from '@suite-common/validators';
import { NumPadButton } from '@suite-native/atoms';
import { useFormContext, useWatch } from '@suite-native/forms';

type PinItemProps = {
    value: number;
};

export const PinMatrixButton = ({ value }: PinItemProps) => {
    const { setValue, getValues, control } = useFormContext();

    const pinLength = useWatch({ control, name: 'pin', compute: pin => pin.length });

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
