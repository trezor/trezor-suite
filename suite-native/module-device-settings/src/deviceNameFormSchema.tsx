import { yup } from '@suite-common/validators';
import { type useTranslate } from '@suite-native/intl';
import { isAscii } from '@trezor/utils';

const noSpecialCharacter = /^(?!.*[\p{M}\p{Lm}])[\x20-\x7E\p{L}\p{N}'-]+$/u;

export const deviceNameFormValidationSchema = (t: ReturnType<typeof useTranslate>['translate']) =>
    yup.object({
        deviceName: yup
            .string()
            .test({
                test: (value?: string) => {
                    if (!value || isAscii(value)) return true;

                    return noSpecialCharacter.test(value);
                },
                message: t('moduleDeviceSettings.changeDeviceName.validations.noSpecialCharacters'),
            })
            .test({
                test: isAscii,
                message: t('moduleDeviceSettings.changeDeviceName.validations.englishLettersOnly'),
            }),
    });
