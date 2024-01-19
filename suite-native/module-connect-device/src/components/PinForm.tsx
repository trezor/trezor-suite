import { Form, useForm } from '@suite-native/forms';
import { Card, HStack, VStack, Box, Text, Loader } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';
import { PinFormValues, pinFormSchema } from '@suite-common/validators';

import { useAtomValue } from 'jotai';

import { isPinFormSubmittingAtom } from '../isPinFormSubmittingAtom';
import { PinMatrixButton } from './PinMatrixButton';
import { PinFormProgress } from './PinFormProgress';
import { PinFormControlButtons } from './PinFormControlButtons';

const pinMatrix = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
];

const MATRIX_MARGIN = 40;

const cardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.small,
    padding: MATRIX_MARGIN,
}));

const pinProgressWrapperStyle = prepareNativeStyle(utils => ({
    height: utils.spacings.extraLarge,
    justifyContent: 'center',
}));

const loaderWrapperStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    margin: MATRIX_MARGIN,
    paddingBottom: utils.spacings.extraLarge,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
}));

export const PinForm = () => {
    const isPinFormSubmitting = useAtomValue(isPinFormSubmittingAtom);
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const form = useForm<PinFormValues>({
        validation: pinFormSchema,

        defaultValues: {
            pin: '',
        },
    });

    const pinLength = form.watch('pin').length;

    return (
        <Form form={form}>
            <VStack spacing="small" alignItems="center">
                <Text color="textSubdued">
                    {translate('moduleConnectDevice.pinScreen.form.keypadInfo')}
                </Text>
                <Box style={applyStyle(pinProgressWrapperStyle)}>
                    <PinFormProgress />
                </Box>
            </VStack>
            <Card style={applyStyle(cardStyle)}>
                <VStack justifyContent="center" alignItems="center" spacing="large">
                    {pinMatrix.map(pinRow => (
                        <HStack key={pinRow.join('')} spacing="medium">
                            {pinRow.map(value => (
                                <PinMatrixButton key={value} value={value} />
                            ))}
                        </HStack>
                    ))}
                    {!!pinLength && <PinFormControlButtons />}
                </VStack>
                {isPinFormSubmitting && (
                    <VStack style={applyStyle(loaderWrapperStyle)} spacing="medium">
                        <Loader size="large" />
                        <Text variant="titleSmall">
                            {translate('moduleConnectDevice.pinScreen.form.submitting')}
                        </Text>
                    </VStack>
                )}
            </Card>
        </Form>
    );
};
