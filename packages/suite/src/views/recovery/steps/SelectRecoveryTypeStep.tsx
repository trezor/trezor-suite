import { Card, Column, Grid, H4, Icon, Paragraph, RadioCard, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { RecoveryType, recoveryTypes } from 'src/types/recovery';

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
                        isActive={recoveryType === type}
                        onClick={() => setRecoveryType(type)}
                        dataTestId={`@recovery/select-type/${type}`}
                    >
                        <Row gap={spacings.md} padding={{ left: spacings.xxs }}>
                            <Icon
                                name={
                                    type === 'standard'
                                        ? 'recoverySeedFilled'
                                        : 'trezorModelOneFilled'
                                }
                                size="extraLarge"
                                variant="tertiary"
                            />
                            <Column gap={spacings.xxxs}>
                                <Paragraph typographyStyle="highlight">
                                    <Translation
                                        id={
                                            type === 'standard'
                                                ? 'TR_BASIC_RECOVERY'
                                                : 'TR_ADVANCED_RECOVERY'
                                        }
                                    />
                                </Paragraph>
                                <Paragraph typographyStyle="hint" variant="tertiary">
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
