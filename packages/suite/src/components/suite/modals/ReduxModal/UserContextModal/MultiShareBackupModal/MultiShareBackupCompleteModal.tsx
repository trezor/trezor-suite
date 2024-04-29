import { Button, Card, Columns, Icon, Rows, Text } from '@trezor/components';
import { HELP_CENTER_RECOVERY_SEED_URL } from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite';
import { onCancel } from 'src/actions/suite/modalActions';
import { Modal, Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { Body, Section } from './MultiShareModalLayout';
import { borders, spacings, spacingsPx } from '@trezor/theme';
import { ReactNode } from 'react';
import { TranslationKey } from '@suite-common/intl-types';
import styled from 'styled-components';

const GradientCallout = styled.div`
    background-image: linear-gradient(
        to right,
        ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1},
        ${({ theme }) => theme.backgroundAlertYellowSubtleOnElevation1}
    );

    border-radius: ${borders.radii.xxs};
    width: 100%;
`;

const GradientCalloutCard = styled.div`
    flex: 1;
    padding: ${spacingsPx.lg} ${spacingsPx.md};
`;

const IconQuestionMarkWrapper = styled.div`
    position: relative;
    margin-bottom: ${spacingsPx.xxxl};
`;

const IconQuestionMark = styled(Icon)`
    position: absolute;
    top: -7px;
    left: 25px;
`;

const TextDiv = styled(Text)`
    display: block;
`;

const Callout = ({ items, header }: { items: ReactNode[]; header: TranslationKey }) => (
    <Card>
        <Rows alignItems="start" gap={spacings.xs}>
            <Text typographyStyle="highlight">
                <Translation id={header} />
            </Text>
            {items.map((item, i) => (
                <Columns key={i} alignItems="start" gap={spacings.xs}>
                    {item}
                </Columns>
            ))}
        </Rows>
    </Card>
);

export const MultiShareBackupCompleteModal = () => {
    const dispatch = useDispatch();

    const handleClose = () => dispatch(onCancel());

    return (
        <Modal
            isCancelable
            onCancel={handleClose}
            heading={<Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />}
            bottomBarComponents={
                <>
                    <Button onClick={handleClose}>
                        <Translation id="TR_MULTI_SHARE_BACKUP_GOT_IT_CLOSE" />
                    </Button>
                    {/*TODO: replace link*/}
                    <LearnMoreButton url={HELP_CENTER_RECOVERY_SEED_URL} size="medium">
                        <Translation id="TR_MULTI_SHARE_TIPS_ON_STORING_BACKUP" />
                    </LearnMoreButton>
                </>
            }
        >
            <Body>
                <Section>
                    <Text typographyStyle="callout" variant="primary">
                        <Translation id="TR_MULTI_SHARE_BACKUP_GREAT" />
                    </Text>
                    <Translation id="TR_CREATE_MULTI_SHARE_BACKUP_CREATED_INFO_TEXT" />
                </Section>

                <Section>
                    <Text typographyStyle="callout">
                        <Translation id="TR_MULTI_SHARE_BACKUP_BACKUPS" />
                    </Text>
                    <Columns gap={spacings.lg} alignItems="stretch">
                        <Callout
                            header="TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_HEADER"
                            items={[
                                <>
                                    <Icon icon="COINS" />
                                    <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE1" />
                                </>,
                                <>
                                    <Icon icon="EYE_SLASH" />
                                    <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE2" />
                                </>,
                            ]}
                        />
                        <Callout
                            header="TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_HEADER"
                            items={[
                                <>
                                    <Icon icon="COINS" />
                                    <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE1" />
                                </>,
                                <>
                                    <Icon icon="EYE_SLASH" />
                                    <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE2" />
                                </>,
                            ]}
                        />
                    </Columns>
                </Section>
                <Section>
                    <Text typographyStyle="callout">
                        <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_WHY_IS_BACKUP_IMPORTANT" />
                    </Text>
                    <GradientCallout>
                        <Columns gap={spacings.lg} alignItems="stretch">
                            <GradientCalloutCard>
                                <IconQuestionMarkWrapper>
                                    <Icon icon="TREZOR_T2T1" size={40} />
                                    <IconQuestionMark
                                        icon="QUESTION_FILLED"
                                        size={24}
                                        variant="primary"
                                    />
                                </IconQuestionMarkWrapper>

                                <TextDiv variant="primary">
                                    <Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR" />
                                </TextDiv>
                                <TextDiv color="subdued">
                                    <Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR_INFO_TEXT" />
                                </TextDiv>
                            </GradientCalloutCard>
                            <GradientCalloutCard>
                                <IconQuestionMarkWrapper>
                                    <Icon icon="BACKUP_2" size={40} />
                                    <IconQuestionMark
                                        icon="QUESTION_FILLED"
                                        size={24}
                                        variant="warning"
                                    />
                                </IconQuestionMarkWrapper>

                                <TextDiv variant="warning">
                                    <Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR" />
                                </TextDiv>

                                <TextDiv color="subdued">
                                    <Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP_INFO_TEXT" />
                                </TextDiv>
                            </GradientCalloutCard>
                        </Columns>
                    </GradientCallout>
                </Section>
            </Body>
        </Modal>
    );
};
