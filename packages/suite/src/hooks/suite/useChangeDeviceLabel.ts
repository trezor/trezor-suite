import { useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';

import { yup } from '@suite-common/validators';
import { selectDeviceLabel, selectDeviceName } from '@suite-common/wallet-core';
import { EventType, analytics } from '@trezor/suite-analytics';
import { isAscii } from '@trezor/utils';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';

import { TranslationFunction } from './useTranslation';

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
                test: value => isAscii(value),
                message: t('TR_LABEL_ERROR_CHARACTERS'),
            }),
    });

export const useChangeDeviceLabel = () => {
    const { translationString } = useTranslation();
    const deviceLabel = useSelector(selectDeviceLabel);
    const deviceName = useSelector(selectDeviceName);
    const dispatch = useDispatch();

    const form = useForm({
        resolver: yupResolver(changeDeviceLabelSchema(translationString)),
        defaultValues: {
            deviceLabel: deviceLabel ?? deviceName,
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    });

    const onSubmit = form.handleSubmit(({ deviceLabel }) => {
        dispatch(applySettings({ label: deviceLabel }));
        analytics.report({
            type: EventType.SettingsDeviceChangeLabel,
        });
    });

    return { form, onSubmit };
};
