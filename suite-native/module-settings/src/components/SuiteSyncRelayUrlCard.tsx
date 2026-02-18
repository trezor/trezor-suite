import {
    SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP,
    SuiteSyncServerTypeSelectValue,
} from '@suite-common/suite-sync-types';
import { Button, Card, Select, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';

import { useSuiteSyncRelayUrlForm } from '../hooks/useSuiteSyncRelayUrlForm';

export const SuiteSyncRelayUrlCard = () => {
    const { translate } = useTranslate();
    const { form, serverTypes, submit } = useSuiteSyncRelayUrlForm();

    const server = form.watch('server');

    const setServer = (value: SuiteSyncServerTypeSelectValue) =>
        form.setValue('server', value, { shouldDirty: true });

    return (
        <Card>
            <Form form={form}>
                <VStack spacing="sp16">
                    <Select<SuiteSyncServerTypeSelectValue>
                        title={
                            <Translation id="moduleSettings.items.features.suiteSync.relayUrl.serverType.label" />
                        }
                        items={serverTypes}
                        value={server}
                        onSelectItem={setServer}
                        isLabelShown
                    />
                    {server === SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.custom.value && (
                        <TextInputField
                            name="customRelayUrl"
                            label={translate(
                                'moduleSettings.items.features.suiteSync.relayUrl.customUrlInput.label',
                            )}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    )}
                    <Button onPress={() => submit()}>
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                </VStack>
            </Form>
        </Card>
    );
};
