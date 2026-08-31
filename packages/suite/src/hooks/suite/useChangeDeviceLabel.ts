import { type UseFormReturn, useForm, useWatch } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { yupResolver } from '@hookform/resolvers/yup';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { type TranslationFunction, useTranslation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import { yup } from '@suite-common/validators';
import { isAscii } from '@trezor/utils';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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

    const { control } = form;
    const currentLabel = useWatch({ control, name: 'deviceLabel' });

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
