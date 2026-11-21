import { useFormatters } from '@suite-common/formatters';
import { type SignAddressCategory, type SignAddressGroup } from '@suite-common/sign-verify';
import {
    Badge,
    type BadgeIntent,
    Box,
    Button,
    Card,
    HStack,
    type SelectItemType,
    Switch,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Form, SelectField, TextInputField, type UseFormReturn } from '@suite-native/forms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type SignFormValues } from './SignVerifyFormValues';

const CATEGORY_BADGES: Record<
    Exclude<SignAddressCategory, 'used'>,
    { label: TxKeyPath; intent: BadgeIntent }
> = {
    fresh: { label: 'signAndVerify.address.badges.fresh', intent: 'brand' },
    change: { label: 'signAndVerify.address.badges.change', intent: 'neutral' },
    stake: { label: 'signAndVerify.address.badges.stake', intent: 'info' },
};

type SignMessageCardProps = {
    form: UseFormReturn<SignFormValues>;
    formats?: SelectItemType<string>[];
    addressGroups: SignAddressGroup[];
    hex: boolean;
    isSigned: boolean;
    onFormatSelect: (format: string) => void;
    onAddressSelect: (address: string) => void;
    onHexChange: (hex: boolean) => void;
    onSign: () => void;
    onClear: () => void;
};

const hexSwitchStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    alignSelf: 'flex-end',
    zIndex: 1,
}));

export const SignMessageCard = ({
    form,
    formats,
    addressGroups,
    hex,
    isSigned,
    onFormatSelect,
    onAddressSelect,
    onHexChange,
    onSign,
    onClear,
}: SignMessageCardProps) => {
    const { translate } = useTranslate();
    const { AddressFormatter } = useFormatters();
    const addressOptions = addressGroups.flatMap(({ category, addresses }) =>
        addresses.map(({ address, path }) => ({
            value: address,
            label: AddressFormatter.format(address, { format: 'long' }),
            path,
            badge:
                category && category !== 'used' ? (
                    <Badge
                        label={translate(CATEGORY_BADGES[category].label)}
                        intent={CATEGORY_BADGES[category].intent}
                    />
                ) : undefined,
        })),
    );
    const { applyStyle } = useNativeStyles();

    return (
        <Card>
            <Form form={form}>
                <VStack spacing="sp16">
                    {formats && (
                        <SelectField
                            name="format"
                            labelType="outsideLabel"
                            title={<Translation id="signAndVerify.format.label" />}
                            items={formats}
                            onSelectItem={onFormatSelect}
                            isReadOnly={isSigned}
                        />
                    )}
                    <SelectField
                        name="address"
                        labelType="outsideLabel"
                        title={<Translation id="signAndVerify.address.label" />}
                        items={addressOptions}
                        onSelectItem={onAddressSelect}
                        showCopyButton={isSigned}
                        isReadOnly={addressOptions.length === 1 || isSigned}
                    />
                    <Box>
                        <HStack style={applyStyle(hexSwitchStyle)}>
                            <Text>
                                <Translation id="signAndVerify.hex.label" />
                            </Text>
                            <Switch isChecked={hex} isDisabled={isSigned} onChange={onHexChange} />
                        </HStack>
                        <TextInputField
                            name="message"
                            labelType="outsideLabel"
                            label={translate('signAndVerify.message.label')}
                            showCopyButton={isSigned}
                            readOnly={isSigned}
                            multiline
                        />
                    </Box>
                    <TextInputField
                        name="signature"
                        labelType="outsideLabel"
                        label={translate('signAndVerify.signature.label')}
                        placeholder={translate('signAndVerify.signature.placeholder')}
                        showCopyButton={isSigned}
                        multiline
                        readOnly
                    />
                    {isSigned ? (
                        <Button onPress={onClear} intent="neutral" priority="secondary">
                            <Translation id="signAndVerify.buttons.clear" />
                        </Button>
                    ) : (
                        <Button onPress={onSign}>
                            <Translation id="signAndVerify.buttons.sign" />
                        </Button>
                    )}
                </VStack>
            </Form>
        </Card>
    );
};
