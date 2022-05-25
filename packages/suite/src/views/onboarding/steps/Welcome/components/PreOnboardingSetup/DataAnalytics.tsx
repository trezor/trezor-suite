import React, { useState } from 'react';
import styled from 'styled-components';
import { analytics } from '@trezor/suite-analytics';
import { DOCS_ANALYTICS_URL, DATA_TOS_URL } from '@trezor/urls';
import { H1, Switch, variables } from '@trezor/components';
import { useOnboarding, useSelector } from '@suite-hooks';
import { CollapsibleBox } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import TrezorLink from '@suite-components/TrezorLink'; // Separate import because of circular dep problem. Error: Cannot create styled-component for component: undefined
import { Box, OnboardingButtonCta } from '@onboarding-components';

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

const StyledTrezorLink = styled(TrezorLink)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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

const CategoryItem = styled(Label)``;

const collectedData = [
    {
        name: <Translation id="TR_DATA_ANALYTICS_CATEGORY_1" />,
        items: [<Translation id="TR_DATA_ANALYTICS_CATEGORY_1_ITEM_1" />],
    },
    {
        name: <Translation id="TR_DATA_ANALYTICS_CATEGORY_2" />,
        items: [<Translation id="TR_DATA_ANALYTICS_CATEGORY_2_ITEM_1" />],
    },
    {
        name: <Translation id="TR_DATA_ANALYTICS_CATEGORY_3" />,
        items: [<Translation id="TR_DATA_ANALYTICS_CATEGORY_3_ITEM_1" />],
    },
];

export const DataAnalytics = () => {
    const { goToSubStep, rerun } = useOnboarding();
    const { recovery } = useSelector(state => ({
        recovery: state.recovery,
    }));
    const [trackingEnabled, setTrackingEnabled] = useState<boolean>(true);

    const confirmChoice = () => {
        if (trackingEnabled) {
            analytics.enable();
        } else {
            analytics.disable();
        }
    };

    const handleConfirm = () => {
        confirmChoice();

        if (recovery.status === 'in-progress') {
            // TT remember the recovery state and should continue with recovery
            rerun();
        } else {
            goToSubStep('security-check');
        }
    };

    return (
        <Box variant="small">
            <Wrapper>
                <Heading>
                    <Translation id="TR_ONBOARDING_DATA_COLLECTION_HEADING" />
                </Heading>
                <Description>
                    <Translation
                        id="TR_ONBOARDING_DATA_COLLECTION_DESCRIPTION"
                        values={{
                            analytics: chunks => (
                                <StyledTrezorLink variant="underline" href={DOCS_ANALYTICS_URL}>
                                    {chunks}
                                </StyledTrezorLink>
                            ),
                            tos: chunks => (
                                <StyledTrezorLink variant="underline" href={DATA_TOS_URL}>
                                    {chunks}
                                </StyledTrezorLink>
                            ),
                        }}
                    />
                </Description>

                <CollapsibleBox
                    variant="small"
                    heading={<Translation id="TR_WHAT_DATA_WE_COLLECT" />}
                >
                    <Category>
                        {collectedData.map((category, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <React.Fragment key={i}>
                                <CategoryName>{category.name}</CategoryName>
                                <CategoryItems>
                                    {category.items.map((item, j) => (
                                        // eslint-disable-next-line react/no-array-index-key
                                        <CategoryItem key={j}>{item}</CategoryItem>
                                    ))}
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
                        <Translation id="TR_ONBOARDING_ALLOW_ANALYTICS" />
                    </Label>
                </SwitchWrapper>

                <ButtonWrapper>
                    <OnboardingButtonCta
                        data-test="@onboarding/continue-button"
                        onClick={handleConfirm}
                    >
                        <Translation id="TR_CONFIRM" />
                    </OnboardingButtonCta>
                </ButtonWrapper>
            </Wrapper>
        </Box>
    );
};
