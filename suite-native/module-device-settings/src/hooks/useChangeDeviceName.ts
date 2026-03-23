import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import {
    type DeviceNameStackParamList,
    DeviceNameStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import TrezorConnect from '@trezor/connect';

import { deviceNameFormValidationSchema } from '../deviceNameFormSchema';

export const MAX_LENGTH = 16;

type NavigationProps = StackNavigationProps<
    DeviceNameStackParamList,
    DeviceNameStackRoutes.DeviceName
>;

export const useChangeDeviceName = () => {
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProps>();
    const device = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();
    const form = useForm({
        validation: deviceNameFormValidationSchema(translate),
        defaultValues: {
            deviceName: device?.label || '',
        },
        mode: 'onChange',
        reValidateMode: 'onChange',
    });

    const deviceNameError = form.formState.errors.deviceName;
    const deviceNameValue = form.watch('deviceName');
    const isMaxLengthReached = deviceNameValue.length >= MAX_LENGTH;
    const isSubmittable = form.formState.isValid && deviceNameValue.length <= MAX_LENGTH;

    const hintMessage =
        !deviceNameError &&
        isMaxLengthReached &&
        translate('moduleDeviceSettings.changeDeviceName.validations.maxLengthInfo');

    const onSubmit = form.handleSubmit(async ({ deviceName }) => {
        if (!device) return;

        const label = deviceName.length === 0 ? device.name : deviceName;
        if (deviceName === device.label) {
            navigation.goBack();

            return;
        }

        navigation.navigate(DeviceNameStackRoutes.ContinueOnTrezor);
        const response = await TrezorConnect.applySettings({
            device: {
                path: device.path,
            },
            label,
        });

        if (!response.success) {
            navigation.goBack();

            return;
        }

        navigation.navigate(DeviceNameStackRoutes.DeviceNameLoadingScreen);

        analytics.report({
            type: events.settingsDeviceChangeLabelEvent.name,
        });
    });

    return {
        form,
        deviceNameValue,
        deviceNameError,
        isSubmittable,
        hintMessage,
        device,
        onSubmit,
        isMaxLengthReached,
    };
};
