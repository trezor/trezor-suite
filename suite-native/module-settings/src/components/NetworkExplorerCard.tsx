import { Badge, Button, HStack, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworkExplorerConnectorSvg } from './NetworkExplorerConnectorSvg';
import { SettingsFormCard } from './SettingsFormCard';
import { type NetworkExplorerForm } from '../hooks/useNetworkExplorerForm';

type NetworkExplorerCardProps = {
    form: NetworkExplorerForm;
};

type ExplorerBadgeProps = {
    isDefault: boolean;
};

type PathInputFieldProps = {
    name: string;
    label: string;
};

const inputFieldWrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginTop: -spacings.sp16,
    marginLeft: spacings.sp10,
    paddingTop: spacings.sp16,
    gap: spacings.sp16,
    overflow: 'hidden',
}));

const ExplorerBadge = ({ isDefault }: ExplorerBadgeProps) =>
    isDefault ? (
        <Badge
            label={<Translation id="moduleSettings.networkBackends.explorer.badge.default" />}
            intent="brand"
        />
    ) : (
        <Badge
            label={<Translation id="moduleSettings.networkBackends.explorer.badge.custom" />}
            intent="warning"
        />
    );

const PathInputField = ({ name, label }: PathInputFieldProps) => (
    <HStack spacing={0}>
        <NetworkExplorerConnectorSvg />
        <TextInputField name={name} label={label} autoCapitalize="none" keyboardType="url" />
    </HStack>
);

export const NetworkExplorerCard = ({ form }: NetworkExplorerCardProps) => {
    const { hookForm, pathInputFields, isDirty, isDefault, submit, setToDefault } = form;

    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <SettingsFormCard
            icon="browser"
            title={<Translation id="moduleSettings.networkBackends.explorer.title" />}
            badge={!isDirty && <ExplorerBadge isDefault={isDefault} />}
        >
            <Form form={hookForm}>
                <TextInputField
                    name="base"
                    label={translate('moduleSettings.networkBackends.explorer.labels.base')}
                    autoCapitalize="none"
                    keyboardType="url"
                />
                <VStack style={applyStyle(inputFieldWrapperStyle)}>
                    {pathInputFields.map(({ name, label }) => (
                        <PathInputField key={name} name={name} label={translate(label)} />
                    ))}
                </VStack>
                {(isDirty || !isDefault) && (
                    <VStack spacing="sp12">
                        {isDirty && (
                            <Button onPress={submit}>
                                <Translation id="generic.buttons.confirm" />
                            </Button>
                        )}
                        <Button onPress={setToDefault} intent="neutral" priority="secondary">
                            <Translation id="moduleSettings.networkBackends.explorer.setToDefaultButton" />
                        </Button>
                    </VStack>
                )}
            </Form>
        </SettingsFormCard>
    );
};
