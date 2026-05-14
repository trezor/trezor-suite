import { type UseFormReturn, useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';

import { type TranslationFunction, useTranslation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { yup } from '@suite-common/validators';
import { isAscii } from '@trezor/utils';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

const changeDeviceLabelSchema = (t: TranslationFunction) =>
    yup.object({
        deviceLabel: yup
            .string()
            .max(
                MAX_LABEL_LENGTH,
                t('TR_LABEL_ERROR_LENGTH', {
                    length: MAX_LABEL_LENGTH,
                }),
            )
            .test({
                test: isAscii,
                message: t('TR_LABEL_ERROR_CHARACTERS'),
            }),
    });

export const useChangeDeviceLabel = (): {
    form: UseFormReturn<
        {
            deviceLabel: string | undefined;
        },
        unknown,
        {
            deviceLabel?: string | undefined;
        }
    >;
    handleSubmit: (onSuccess?: () => void) => void;
} => {
    const analytics = useAnalytics();
    const { translationString } = useTranslation();
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const dispatch = useDispatch();

    const form = useForm({
        resolver: yupResolver(changeDeviceLabelSchema(translationString)),
        defaultValues: {
            deviceLabel,
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    });

    const { watch } = form;
    const currentLabel = watch('deviceLabel');

    const onSubmit = form.handleSubmit(({ deviceLabel }) => {
        dispatch(applySettings({ label: deviceLabel }));
        analytics.report({
            type: events.settingsDeviceChangeLabelEvent.name,
        });
    });

    const handleSubmit = async (onSuccess?: () => void) => {
        if (currentLabel === deviceLabel) {
            onSuccess?.();

            return;
        }

        try {
            await onSubmit();
            onSuccess?.();
        } catch (error) {
            console.error(error);
        }
    };

    return { form, handleSubmit };
};
