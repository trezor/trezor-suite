import { Form, useForm } from '@suite-native/forms';
import { Card, HStack, VStack, Box, Text, Loader, Image } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { PinFormValues, pinFormSchema } from '@suite-common/validators';

import { deviceImageMap } from '../../constants/deviceImageConstants';
import { PinMatrixButton } from './PinMatrixButton';
import { PinFormProgress } from './PinFormProgress';
import { PinFormControlButtons } from './PinFormControlButtons';

export type PinFormVariant = 'current' | 'new' | 'confirm';

type PinOnKeypadProps = {
    variant: PinFormVariant;
    onSuccess?: () => void;
};

type PinFormTranslations = {
    formTitle: TxKeyPath;
    loaderText: TxKeyPath;
};

const translationsMap = {
    current: {
        formTitle: 'moduleConnectDevice.pinScreen.form.title.current',
        loaderText: 'moduleConnectDevice.pinScreen.form.submitting',
    },
    new: {
        formTitle: 'moduleConnectDevice.pinScreen.form.title.new',
        loaderText: 'moduleConnectDevice.pinScreen.form.processing',
    },
    confirm: {
        formTitle: 'moduleConnectDevice.pinScreen.form.title.confirm',
        loaderText: 'moduleConnectDevice.pinScreen.form.processing',
    },
} as const satisfies Record<PinFormVariant, PinFormTranslations>;

const pinMatrix = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
];

const MATRIX_MARGIN = 40;

const cardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp8,
    padding: MATRIX_MARGIN,
}));

const pinProgressWrapperStyle = prepareNativeStyle(utils => ({
    height: utils.spacings.sp32,
    justifyContent: 'center',
}));

const loaderWrapperStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    margin: MATRIX_MARGIN,
    paddingBottom: utils.spacings.sp32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
}));

export const PinOnKeypad = ({ variant, onSuccess }: PinOnKeypadProps) => {
    const { applyStyle } = useNativeStyles();
    const form = useForm<PinFormValues>({
        validation: pinFormSchema,
        defaultValues: {
            pin: '',
        },
    });

    const translations = translationsMap[variant];

    return (
        <VStack spacing="sp16" alignItems="center" flex={1} marginTop="sp24">
            <Image source={deviceImageMap.T1B1} width={161} height={194} />
            <Form form={form}>
                <VStack spacing="sp8" alignItems="center">
                    <Text color="textSubdued">
                        <Translation id="moduleConnectDevice.pinScreen.form.keypadInfo" />
                    </Text>
                    <Box style={applyStyle(pinProgressWrapperStyle)}>
                        <PinFormProgress title={<Translation id={translations.formTitle} />} />
                    </Box>
                </VStack>
                <Card style={applyStyle(cardStyle)}>
                    <VStack justifyContent="center" alignItems="center" spacing="sp24">
                        {pinMatrix.map(pinRow => (
                            <HStack key={pinRow.join('')} spacing="sp16">
                                {pinRow.map(value => (
                                    <PinMatrixButton key={value} value={value} />
                                ))}
                            </HStack>
                        ))}
                    </VStack>
                    <PinFormControlButtons onSuccess={onSuccess} />
                    {form.formState.isSubmitted && (
                        <VStack style={applyStyle(loaderWrapperStyle)} spacing="sp16">
                            <Loader size="large" />
                            <Text variant="titleSmall">
                                <Translation id={translations.loaderText} />
                            </Text>
                        </VStack>
                    )}
                </Card>
            </Form>
        </VStack>
    );
};
