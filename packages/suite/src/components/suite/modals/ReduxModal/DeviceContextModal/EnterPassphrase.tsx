import { useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectDeviceModel } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Card, Collapsible, Column, H3, H4, Icon, Paragraph, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { getNonAsciiChars } from '@trezor/utils';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

import { PassphraseInputCard } from './PassphraseInputCard';
import { useSelector } from '../../../../../hooks/suite';
import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';

type EnterPassphraseProps = {
    offerPassphraseOnDevice: boolean;
    device: TrezorDevice;
    submitting?: boolean;
    isExistingWallet?: boolean;
    onBack: () => void;
    onCancel: () => void;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

export const EnterPassphrase = ({
    device,
    offerPassphraseOnDevice,
    isExistingWallet = false,
    submitting,
    onBack,
    onCancel,
    onSubmit,
}: EnterPassphraseProps) => {
    const [value, setValue] = useState('');
    const deviceModel = useSelector(selectDeviceModel);
    const isUsingNonAsciiCharacters = getNonAsciiChars(value) !== null;

    return (
        <SwitchDeviceModal onCancel={onCancel}>
            <CardWithDevice onCancel={onCancel} device={device} onBackButtonClick={onBack}>
                <Column gap={spacings.xl}>
                    <Column gap={spacings.md} padding={{ horizontal: spacings.xs }}>
                        <H3>
                            {isExistingWallet ? (
                                <Translation id="TR_PASSPHRASE_OPEN_USED_HEADING" />
                            ) : (
                                <Translation id="TR_PASSPHRASE_CREATE_NEW_HEADING" />
                            )}
                        </H3>
                        <Column gap={spacings.sm}>
                            {isExistingWallet ? (
                                <Row gap={spacings.sm}>
                                    <Icon name="warning" size={16} />
                                    <Paragraph
                                        intent="neutral"
                                        priority="secondary"
                                        typographyStyle="body-sm"
                                    >
                                        <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM3" />
                                    </Paragraph>
                                </Row>
                            ) : (
                                <Row gap={spacings.sm}>
                                    <Icon name="password" size={16} />
                                    <Paragraph
                                        intent="neutral"
                                        priority="secondary"
                                        typographyStyle="body-sm"
                                    >
                                        <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM2" />
                                    </Paragraph>
                                </Row>
                            )}
                            <Collapsible
                                gap={spacings.sm}
                                isOpen={isUsingNonAsciiCharacters ? true : undefined}
                            >
                                <Collapsible.Toggle>
                                    <Row gap={spacings.sm}>
                                        <Icon name="hash" size={16} />
                                        <Paragraph
                                            intent="neutral"
                                            priority="secondary"
                                            typographyStyle="body-sm"
                                            flex="1"
                                        >
                                            <Translation
                                                id="TR_PASSPHRASE_NON_ASCII_CHARS"
                                                values={{
                                                    code: text => (
                                                        <Text isHighlighted isMonospaced>
                                                            {text}
                                                        </Text>
                                                    ),
                                                }}
                                            />
                                        </Paragraph>
                                        <Collapsible.ToggleIcon size={16} />
                                    </Row>
                                </Collapsible.Toggle>
                                <Collapsible.Content>
                                    <Card
                                        fillType="flat"
                                        paddingType="tiny"
                                        footer={
                                            <Row gap={spacings.sm} justifyContent="space-between">
                                                <Paragraph
                                                    typographyStyle="body-xs"
                                                    intent="neutral"
                                                    priority="secondary"
                                                >
                                                    <Translation id="TR_PASSPHRASE_NON_ASCII_CHARS_WARNING" />
                                                </Paragraph>
                                                <LearnMoreButton
                                                    url={HELP_CENTER_PASSPHRASE_URL}
                                                    target="_blank"
                                                >
                                                    <Translation id="TR_LEARN" />
                                                </LearnMoreButton>
                                            </Row>
                                        }
                                    >
                                        <Text isMonospaced typographyStyle="body-sm">
                                            {
                                                '! " # $ % & \\ \' ( ) * +  - . / : ; < = > ? @ [  ] ^ _ ` { | } ~'
                                            }
                                        </Text>
                                    </Card>
                                </Collapsible.Content>
                            </Collapsible>
                            {!isExistingWallet && (
                                <Collapsible gap={spacings.sm}>
                                    <Collapsible.Toggle>
                                        <Row gap={spacings.sm}>
                                            <Icon name="lightbulb" size={16} />
                                            <Paragraph
                                                intent="neutral"
                                                priority="secondary"
                                                typographyStyle="body-sm"
                                                flex="1"
                                            >
                                                <Translation id="TR_PASSPHRASE_EXAMPLES" />
                                            </Paragraph>
                                            <Collapsible.ToggleIcon size={16} />
                                        </Row>
                                    </Collapsible.Toggle>
                                    <Collapsible.Content>
                                        <Column gap={spacings.sm}>
                                            {[1, 2, 3].map(item => (
                                                <Card fillType="flat" paddingType="tiny" key={item}>
                                                    <H4
                                                        typographyStyle="body-sm-strong"
                                                        intent="brand"
                                                    >
                                                        <Translation
                                                            id={
                                                                `TR_PASSPHRASE_EXAMPLES_ITEM${item}_HEADING` as TranslationKey
                                                            }
                                                        />
                                                    </H4>
                                                    <Text isMonospaced typographyStyle="body-sm">
                                                        <Translation
                                                            id={
                                                                `TR_PASSPHRASE_EXAMPLES_ITEM${item}_DESCRIPTION` as TranslationKey
                                                            }
                                                        />
                                                    </Text>
                                                </Card>
                                            ))}
                                        </Column>
                                    </Collapsible.Content>
                                </Collapsible>
                            )}
                        </Column>
                    </Column>
                    <PassphraseInputCard
                        deviceModel={deviceModel ?? undefined}
                        isLoading={submitting}
                        onSubmit={onSubmit}
                        offerPassphraseOnDevice={offerPassphraseOnDevice}
                        allowNonAsciiCharacters={isExistingWallet}
                        value={value}
                        setValue={setValue}
                    />
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
