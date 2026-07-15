import { type ReactNode } from 'react';

import { TrezorLink } from '@suite/external-links';
import { Translation, type TranslationKey } from '@suite/intl';
import {
    Card,
    Flex,
    type FlexDirection,
    Grid,
    Icon,
    type IconComponent,
    Note,
    Paragraph,
    Row,
    StepList,
    type StepListItemState,
} from '@trezor/components';
import {
    CameraSlashIcon,
    EyeSlashIcon,
    PencilIcon,
    RecoverySeedIcon,
    TimerIcon,
} from '@trezor/icons';
import { spacings } from '@trezor/theme';
import { ESHOP_KEEP_METAL_MULTI_SHARE_URL, HELP_CENTER_SEED_CARD_URL } from '@trezor/urls';

import type { Steps } from './steps';

type InstructionItemProps = {
    direction?: FlexDirection;
    icon: IconComponent;
    children: ReactNode;
};

const InstructionItem = ({ direction = 'row', icon, children }: InstructionItemProps) => (
    <Card paddingType="normal">
        <Flex direction={direction} alignItems="center" gap={spacings.xs} height="100%">
            <Icon size={32} as={icon} />
            <Paragraph
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
                align={direction === 'column' ? 'center' : 'start'}
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
    state: StepListItemState;
};

const Step = ({ title, time, children, state }: StepProps) => (
    <StepList.Item
        title={
            <Row gap={spacings.sm}>
                <Translation id={title} />
                {state !== 'done' && (
                    <Note icon={TimerIcon}>
                        <Translation id="TR_N_MIN" values={{ n: time }} />
                    </Note>
                )}
            </Row>
        }
        state={state}
    >
        {state === 'default' && children}
    </StepList.Item>
);

type MultiShareBackupStep2to4Props = {
    step: Extract<Steps, 'second-info' | 'verify-ownership' | 'backup-seed'>;
};

export const MultiShareBackupStep2to4 = ({ step }: MultiShareBackupStep2to4Props) => (
    <StepList isOrdered margin={{ top: spacings.md }}>
        <Step
            time={2}
            title="TR_VERIFY_TREZOR_OWNERSHIP"
            state={step === 'backup-seed' ? 'done' : 'default'}
        >
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_EXPLANATION" />
            </Paragraph>
            <Grid margin={{ top: spacings.md }} columns={2} gap={spacings.sm}>
                <InstructionItem icon={RecoverySeedIcon}>
                    <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_CARD_1" />
                </InstructionItem>
                <InstructionItem icon={CameraSlashIcon}>
                    <Translation id="TR_VERIFY_TREZOR_OWNERSHIP_CARD_2" />
                </InstructionItem>
            </Grid>
        </Step>
        <Step
            time={10}
            title="TR_CREATE_SHARES"
            state={step === 'verify-ownership' ? 'pending' : 'default'}
        >
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_CREATE_SHARES_EXPLANATION" />{' '}
                <Translation id="TR_CREATE_SHARES_EXAMPLE" />
            </Paragraph>
            <Grid margin={{ top: spacings.lg }} columns={3} gap={spacings.sm}>
                <InstructionItem direction="column" icon={PencilIcon}>
                    <Translation
                        id="TR_CREATE_SHARES_CARD_1"
                        values={{
                            cardsLink: chunks => (
                                <TrezorLink href={HELP_CENTER_SEED_CARD_URL}>{chunks}</TrezorLink>
                            ),
                            keepLink: chunks => (
                                <TrezorLink href={ESHOP_KEEP_METAL_MULTI_SHARE_URL}>
                                    {chunks}
                                </TrezorLink>
                            ),
                        }}
                    />
                </InstructionItem>
                <InstructionItem direction="column" icon={CameraSlashIcon}>
                    <Translation id="TR_CREATE_SHARES_CARD_2" />
                </InstructionItem>
                <InstructionItem direction="column" icon={EyeSlashIcon}>
                    <Translation id="TR_CREATE_SHARES_CARD_3" />
                </InstructionItem>
            </Grid>
        </Step>
    </StepList>
);
