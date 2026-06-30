import { Translation } from '@suite/intl';
import { type RecoveryType, recoveryTypes } from '@suite/recovery';
import { Card, Column, Grid, H4, Icon, Paragraph, RadioCard, Row } from '@trezor/components';
import { RecoverySeedFilledIcon, TrezorModelOneFilledIcon } from '@trezor/icons';
import { spacings } from '@trezor/theme';

type SelectRecoveryTypeStepProps = {
    setRecoveryType: (type: RecoveryType) => void;
    recoveryType?: RecoveryType;
};

export const SelectRecoveryTypeStep = ({
    setRecoveryType,
    recoveryType,
}: SelectRecoveryTypeStepProps) => (
    <Card margin={{ top: spacings.xs }}>
        <Column gap={spacings.md}>
            <H4>
                <Translation id="TR_CHOOSE_RECOVERY_TYPE" />
            </H4>
            <Grid columns={2} gap={spacings.md}>
                {recoveryTypes.map(type => (
                    <RadioCard
                        key={type}
                        isSelected={recoveryType === type}
                        onClick={() => setRecoveryType(type)}
                        dataTestId={`@recovery/select-type/${type}`}
                    >
                        <Row gap={spacings.md} padding={{ left: spacings.xxs }}>
                            <Icon
                                as={
                                    type === 'standard'
                                        ? RecoverySeedFilledIcon
                                        : TrezorModelOneFilledIcon
                                }
                                size={32}
                                intent="neutral"
                                priority="secondary"
                            />
                            <Column gap={spacings.xxxs}>
                                <Paragraph typographyStyle="body-md-strong">
                                    <Translation
                                        id={
                                            type === 'standard'
                                                ? 'TR_BASIC_RECOVERY'
                                                : 'TR_ADVANCED_RECOVERY'
                                        }
                                    />
                                </Paragraph>
                                <Paragraph
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id={
                                            type === 'standard'
                                                ? 'TR_BASIC_RECOVERY_OPTION'
                                                : 'TR_ADVANCED_RECOVERY_OPTION'
                                        }
                                    />
                                </Paragraph>
                            </Column>
                        </Row>
                    </RadioCard>
                ))}
            </Grid>
        </Column>
    </Card>
);
