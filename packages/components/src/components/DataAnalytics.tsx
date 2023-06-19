import React, { useState } from 'react';
import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import { variables } from '../config';
import { Button } from './buttons/Button';
import { CollapsibleBox } from './CollapsibleBox';
import { CollapsibleCard } from './CollapsibleCard';
import { Switch } from './form/Switch';
import { H1 } from './typography/Heading';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const SwitchWrapper = styled.div`
    display: flex;
    margin-bottom: 36px;
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-self: center;
`;

const StyledButton = styled(Button)`
    min-width: 180px;
`;

const Label = styled.span`
    margin-left: 20px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
    align-items: center;
    display: flex;
`;

const Heading = styled(H1)`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    margin-bottom: 16px;
    text-align: left;
`;

const Description = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};

    margin-bottom: 20px;
    /* text-align: center; */
`;

const Category = styled.div`
    display: grid;
    grid-template-columns: 1fr 4fr;
    grid-gap: 20px;
    width: 100%;
`;
const CategoryItems = styled.div`
    display: flex;
    flex-direction: column;
`;

const CategoryName = styled(Description)`
    margin-bottom: 0px;
    width: 120px;
`;

const collectedData = [
    {
        name: <FormattedMessage id="TR_DATA_ANALYTICS_CATEGORY_1" defaultMessage="Platform" />,
        item: (
            <FormattedMessage
                id="TR_DATA_ANALYTICS_CATEGORY_1_ITEM_1"
                defaultMessage="OS, Trezor model, version etc."
            />
        ),
    },
    {
        name: <FormattedMessage id="TR_DATA_ANALYTICS_CATEGORY_2" defaultMessage="Usage" />,
        item: (
            <FormattedMessage
                id="TR_DATA_ANALYTICS_CATEGORY_2_ITEM_1"
                defaultMessage="How you use app"
            />
        ),
    },
    {
        name: <FormattedMessage id="TR_DATA_ANALYTICS_CATEGORY_3" defaultMessage="Audience" />,
        item: (
            <FormattedMessage
                id="TR_DATA_ANALYTICS_CATEGORY_3_ITEM_1"
                defaultMessage="Language, user count, etc."
            />
        ),
    },
];

type DataAnalyticsProps = {
    onConfirm: (trackingEnabled: boolean) => void;
    analyticsLink?: (chunks: React.ReactNode[]) => JSX.Element;
    tosLink?: (chunks: React.ReactNode[]) => JSX.Element;
};

export const DataAnalytics = ({ onConfirm, analyticsLink, tosLink }: DataAnalyticsProps) => {
    const [trackingEnabled, setTrackingEnabled] = useState<boolean>(true);

    return (
        <CollapsibleCard variant="small" data-test="@analytics/consent">
            <Wrapper>
                <Heading>
                    <FormattedMessage
                        id="TR_ONBOARDING_DATA_COLLECTION_HEADING"
                        defaultMessage="Anonymous data collection"
                    />
                </Heading>
                <Description>
                    <FormattedMessage
                        id="TR_ONBOARDING_DATA_COLLECTION_DESCRIPTION"
                        values={{
                            analytics: analyticsLink || (chunks => chunks),
                            tos: tosLink || (chunks => chunks),
                        }}
                        defaultMessage="All data is anonymous and is used only for product development purposes. Read more in our <analytics>technical documentation</analytics> and <tos>Terms & Conditions</tos>."
                    />
                </Description>

                <CollapsibleBox
                    variant="small"
                    heading={
                        <FormattedMessage
                            id="TR_WHAT_DATA_WE_COLLECT"
                            defaultMessage="What data do we collect"
                        />
                    }
                >
                    <Category>
                        {collectedData.map((category, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <React.Fragment key={i}>
                                <CategoryName>{category.name}</CategoryName>
                                <CategoryItems>
                                    <Label>{category.item}</Label>
                                </CategoryItems>
                            </React.Fragment>
                        ))}
                    </Category>
                </CollapsibleBox>

                <SwitchWrapper>
                    <Switch
                        isChecked={trackingEnabled}
                        onChange={() => setTrackingEnabled(!trackingEnabled)}
                        dataTest="@analytics/toggle-switch"
                    />
                    <Label>
                        <FormattedMessage
                            id="TR_ONBOARDING_ALLOW_ANALYTICS"
                            defaultMessage="Allow anonymous data collection"
                        />
                    </Label>
                </SwitchWrapper>

                <ButtonWrapper>
                    <StyledButton
                        data-test="@analytics/continue-button"
                        onClick={() => onConfirm(trackingEnabled)}
                    >
                        <FormattedMessage id="TR_CONFIRM" defaultMessage="Confirm" />
                    </StyledButton>
                </ButtonWrapper>
            </Wrapper>
        </CollapsibleCard>
    );
};
