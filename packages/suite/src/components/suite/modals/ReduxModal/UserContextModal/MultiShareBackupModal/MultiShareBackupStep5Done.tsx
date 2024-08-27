import { Card, Row, Column, Text, Icon } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { Body, Section } from './multiShareModalLayout';
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
        <Column alignItems="start" gap={spacings.xs}>
            <Text typographyStyle="highlight">
                <Translation id={header} />
            </Text>
            {items.map((item, i) => (
                <Row key={i} alignItems="start" gap={spacings.xs}>
                    {item}
                </Row>
            ))}
        </Column>
    </Card>
);

export const MultiShareBackupStep5Done = () => (
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
            <Row gap={spacings.lg} alignItems="stretch">
                <Callout
                    header="TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_HEADER"
                    items={[
                        <>
                            <Icon name="coins" />
                            <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE1" />
                        </>,
                        <>
                            <Icon name="eyeSlash" />
                            <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE2" />
                        </>,
                    ]}
                />
                <Callout
                    header="TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_HEADER"
                    items={[
                        <>
                            <Icon name="coins" />
                            <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE1" />
                        </>,
                        <>
                            <Icon name="eyeSlash" />
                            <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE2" />
                        </>,
                    ]}
                />
            </Row>
        </Section>
        <Section>
            <Text typographyStyle="callout">
                <Translation id="TR_MULTI_SHARE_BACKUP_SUCCESS_WHY_IS_BACKUP_IMPORTANT" />
            </Text>
            <GradientCallout>
                <Row gap={spacings.lg} alignItems="stretch">
                    <GradientCalloutCard>
                        <IconQuestionMarkWrapper>
                            <Icon name="trezorT2T1" size={40} />
                            <IconQuestionMark name="question" size={24} variant="primary" />
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
                            <Icon name="backup2" size={40} />
                            <IconQuestionMark name="questionFilled" size={24} variant="warning" />
                        </IconQuestionMarkWrapper>

                        <TextDiv variant="warning">
                            <Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP" />
                        </TextDiv>

                        <TextDiv color="subdued">
                            <Translation id="TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP_INFO_TEXT" />
                        </TextDiv>
                    </GradientCalloutCard>
                </Row>
            </GradientCallout>
        </Section>
    </Body>
);
