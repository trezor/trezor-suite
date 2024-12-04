import { ReactNode } from 'react';

import {
    BulletList,
    BulletListItemState,
    Paragraph,
    Grid,
    Card,
    Icon,
    IconName,
    Flex,
    Note,
    Row,
    FlexDirection,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { ESHOP_KEEP_METAL_SINGLE_SHARE_URL, HELP_CENTER_SEED_CARD_URL } from '@trezor/urls';
import { TranslationKey } from '@suite-common/intl-types';

import { Translation, TrezorLink } from 'src/components/suite';

import type { Steps } from './MultiShareBackupModal';

type InstructionItemProps = {
    direction?: FlexDirection;
    icon: IconName;
    children: ReactNode;
};

const InstructionItem = ({ direction = 'row', icon, children }: InstructionItemProps) => (
    <Card paddingType="normal">
        <Flex direction={direction} alignItems="center" gap={spacings.xs} height="100%">
            <Icon size="extraLarge" name={icon} />
            <Paragraph
                typographyStyle="hint"
                variant="tertiary"
                align={direction === 'column' ? 'center' : 'left'}
            >
                {children}
            </Paragraph>
        </Flex>
    </Card>
);

type StepProps = {
    time: number;
    title: TranslationKey;
    children: ReactNode;
    state: BulletListItemState;
};

const Step = ({ title, time, children, state }: StepProps) => (
    <BulletList.Item
        title={
            <Row gap={spacings.sm}>
                <Translation id={title} />
                {state !== 'done' && (
                    <Note iconName="timer">
                        <Translation id="TR_N_MIN" values={{ n: time }} />
                    </Note>
                )}
            </Row>
        }
        state={state}
    >
        {state === 'default' && children}
    </BulletList.Item>
);

type MultiShareBackupStep2to4Props = {
    step: Extract<Steps, 'second-info' | 'verify-ownership' | 'backup-seed'>;
};

export const MultiShareBackupStep2to4 = ({ step }: MultiShareBackupStep2to4Props) => (
    <BulletList isOrdered margin={{ top: spacings.md }}>
        <Step
            time={2}
            title="TR_VERIFY_TREZOR_OWNERSHIP"
            state={step === 'backup-seed' ? 'done' : 'default'}
        >
            <Paragraph variant="tertiary">
                <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_EXPLANATION" />
            </Paragraph>
            <Grid margin={{ top: spacings.md }} columns={2} gap={spacings.sm}>
                <InstructionItem icon="recoverySeed">
                    <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_CARD_1" />
                </InstructionItem>
                <InstructionItem icon="cameraSlash">
                    <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_CARD_2" />
                </InstructionItem>
            </Grid>
        </Step>
        <Step
            time={10}
            title="TR_CREATE_SHARES"
            state={step === 'verify-ownership' ? 'pending' : 'default'}
        >
            <Paragraph variant="tertiary">
                <Translation id="TR_CREATE_SHARES_EXPLANATION" />{' '}
                <Translation id="TR_CREATE_SHARES_EXAMPLE" />
            </Paragraph>
            <Grid margin={{ top: spacings.lg }} columns={3} gap={spacings.sm}>
                <InstructionItem direction="column" icon="pencil">
                    <Translation
                        id="TR_CREATE_SHARES_CARD_1"
                        values={{
                            cardsLink: chunks => (
                                <TrezorLink
                                    href={HELP_CENTER_SEED_CARD_URL}
                                    variant="underline"
                                    typographyStyle="hint"
                                >
                                    {chunks}
                                </TrezorLink>
                            ),
                            keepLink: chunks => (
                                <TrezorLink
                                    href={ESHOP_KEEP_METAL_SINGLE_SHARE_URL}
                                    variant="underline"
                                    typographyStyle="hint"
                                >
                                    {chunks}
                                </TrezorLink>
                            ),
                        }}
                    />
                </InstructionItem>
                <InstructionItem direction="column" icon="cameraSlash">
                    <Translation id="TR_CREATE_SHARES_CARD_2" />
                </InstructionItem>
                <InstructionItem direction="column" icon="eyeSlash">
                    <Translation id="TR_CREATE_SHARES_CARD_3" />
                </InstructionItem>
            </Grid>
        </Step>
    </BulletList>
);
