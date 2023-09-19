import { Box, Button, HStack, IconButton } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';

import { PIN_FORM_MIN_LENGTH } from '../constants/pinFormConstants';

export const PinFormControlButtons = () => {
    const { handleSubmit, getValues, watch, setValue } = useFormContext();

    const onSubmit = handleSubmit(
        _ => null,
        _ => null,
    );

    const handleDelete = () => {
        const pin = getValues('pin');
        setValue('pin', pin.slice(0, -1));
    };

    const pinLength = watch('pin').length;

    return (
        <HStack spacing="medium">
            {!!pinLength && (
                <IconButton
                    onPress={handleDelete}
                    iconName="backspace"
                    colorScheme="tertiaryElevation0"
                />
            )}
            <Box flex={1}>
                <Button isDisabled={pinLength < PIN_FORM_MIN_LENGTH} onPress={onSubmit}>
                    Enter pin
                </Button>
            </Box>
        </HStack>
    );
};
