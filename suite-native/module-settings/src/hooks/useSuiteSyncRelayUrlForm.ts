import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type ChangeServerModalFields,
    SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP,
    type SuiteSyncServerTypeSelectValue,
    createChangeSuiteSyncServerSchema,
    selectSuiteSyncCustomRelayUrl,
} from '@suite-common/suite-sync';
import { type SelectItemType } from '@suite-native/atoms';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';

export const useSuiteSyncRelayUrlForm = () => {
    const { translate } = useTranslate();
    const customRelayUrl = useSelector(selectSuiteSyncCustomRelayUrl);
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();

    const serverTypes = useMemo<SelectItemType<SuiteSyncServerTypeSelectValue>[]>(
        () => [
            {
                value: SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.default.value,
                label: translate(
                    'moduleSettings.items.features.suiteSync.relayUrl.serverType.default',
                ),
            },
            {
                value: SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.custom.value,
                label: translate(
                    'moduleSettings.items.features.suiteSync.relayUrl.serverType.custom',
                ),
            },
        ],
        [translate],
    );

    const form = useForm<ChangeServerModalFields>({
        validation: createChangeSuiteSyncServerSchema({
            requiredTranslation: translate(
                'moduleSettings.items.features.suiteSync.relayUrl.customUrlInput.required',
            ),
            invalidUrlTranslation: translate(
                'moduleSettings.items.features.suiteSync.relayUrl.customUrlInput.invalidUrl',
            ),
        }),
        defaultValues: {
            server: customRelayUrl
                ? SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.custom.value
                : SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.default.value,
            customRelayUrl,
        },
        mode: 'onSubmit',
    });

    const submit = (onSuccess?: () => void) =>
        form.handleSubmit(async values => {
            const relayUrl =
                values.server === SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.default.value
                    ? null
                    : values.customRelayUrl;

            await suiteSync.changeRelayUrl({ relayUrl });
            showToast({
                variant: 'success',
                message: translate('moduleSettings.items.features.suiteSync.relayUrl.saved'),
            });
            onSuccess?.();
        })();

    return {
        form,
        serverTypes,
        submit,
    };
};
