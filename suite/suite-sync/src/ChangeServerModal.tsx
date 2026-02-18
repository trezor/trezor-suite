import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { yupResolver } from '@hookform/resolvers/yup';

import { Translation, useTranslation } from '@suite/intl';
import { selectSuiteSyncCustomRelayUrl } from '@suite-common/suite-sync';
import {
    type ChangeServerModalFields,
    SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP,
    type SuiteSync,
    type SuiteSyncServerTypeOption,
    createChangeSuiteSyncServerSchema,
} from '@suite-common/suite-sync-types';
import { Card, Column, Input, Modal, Select } from '@trezor/components';

type ChangeServerModalProps = {
    suiteSync: SuiteSync;
    onCancel: () => void;
};

export const ChangeServerModal = ({ suiteSync, onCancel }: ChangeServerModalProps) => {
    const { translationString } = useTranslation();
    const customRelayUrl = useSelector(selectSuiteSyncCustomRelayUrl);

    const formSchema = useMemo(
        () =>
            createChangeSuiteSyncServerSchema({
                requiredTranslation: translationString('TR_REQUIRED_FIELD'),
                invalidUrlTranslation: translationString('TR_CUSTOM_BACKEND_INVALID_URL'),
            }),
        [translationString],
    );

    const translatedOptionsMap = useMemo(
        () => [
            {
                value: SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.default.value,
                label: translationString('TR_SUITE_SYNC_SERVER_TREZOR_DEFAULT'),
            },
            {
                value: SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.custom.value,
                label: translationString('TR_SUITE_SYNC_SERVER_CUSTOM'),
            },
        ],
        [translationString],
    );

    const form = useForm<ChangeServerModalFields>({
        resolver: yupResolver(formSchema),
        defaultValues: {
            server: customRelayUrl
                ? SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.custom.value
                : SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.default.value,
            customRelayUrl,
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    });

    const { handleSubmit, watch } = form;
    const watchedServer = watch('server');

    const onSubmit = handleSubmit(async values => {
        const relayUrl =
            values.server === SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.default.value
                ? null
                : values.customRelayUrl;

        await suiteSync.changeRelayUrl({ relayUrl });
        onCancel();
    });

    return (
        <Modal
            heading={<Translation id="TR_SUITE_SYNC_SERVER_MODAL" />}
            description={<Translation id="TR_SUITE_SYNC_SERVER_MODAL_DESCRIPTION" />}
            onCancel={onCancel}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={onSubmit}
                        intent="brand"
                        data-testid="@settings/custom-relay-url-save-button"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <form onSubmit={onSubmit}>
                <Card header={<Translation id="TR_SUITE_SYNC_SERVER" />}>
                    <Column gap={8}>
                        <Controller
                            name="server"
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    options={translatedOptionsMap}
                                    value={translatedOptionsMap.find(
                                        option => option.value === field.value,
                                    )}
                                    onChange={(selected: SuiteSyncServerTypeOption<string>) =>
                                        field.onChange(selected.value)
                                    }
                                    data-testid="@settings/labeling/server-type-select"
                                    openMenuOnFocus={false}
                                />
                            )}
                        />

                        {watchedServer === SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.custom.value && (
                            <Controller
                                name="customRelayUrl"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Input
                                        placeholder={translationString(
                                            'TR_SUITE_SYNC_SERVER_CUSTOM_PLACEHOLDER',
                                        )}
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        hasError={!!fieldState.error}
                                        bottomText={fieldState.error?.message}
                                        data-testid="@settings/custom-relay-url-input"
                                    />
                                )}
                            />
                        )}
                    </Column>
                </Card>
            </form>
        </Modal>
    );
};
