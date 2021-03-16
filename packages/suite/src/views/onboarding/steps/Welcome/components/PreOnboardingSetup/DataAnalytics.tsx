import React from 'react';
import styled from 'styled-components';
import { useSpring, config } from 'react-spring';
import { H1, Icon, Switch, variables } from '@trezor/components';
import { useAnalytics, useOnboarding } from '@suite-hooks';
import { Translation, TrezorLink, CollapsibleBox } from '@suite-components';
import { Box, OnboardingButton } from '@onboarding-components';
import { TOS_URL } from '@suite-constants/urls';

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
        name: 'Category1',
        items: ['Něco, něco dalšího, něco nejvíc dalšího, něco absolutně nekontroverzního.'],
    },
    {
        name: 'Category2',
        items: ['Něco, něco dalšího.', 'Něco, něco dalšího.'],
    },
    {
        name: 'Category2',
        items: ['Něco, něco dalšího.', 'Něco, něco dalšího.'],
    },
    {
        name: 'Category2',
        items: ['Něco, něco dalšího.', 'Něco, něco dalšího.'],
    },
];

const DataAnalytics = () => {
    const { enable, dispose, enabled } = useAnalytics();
    const { goToSubStep } = useOnboarding();
    const fadeStyles = useSpring({
        config: { ...config.default },
        from: { opacity: 0 },
        to: { opacity: 1 },
    });

    return (
        <Box style={fadeStyles} variant="small">
            <Wrapper>
                <Heading>
                    <Translation id="TR_ONBOARDING_DATA_COLLECTION_HEADING" />
                </Heading>
                <Description>
                    <Translation
                        id="TR_ONBOARDING_DATA_COLLECTION_DESCRIPTION"
                        values={{
                            a: chunks => (
                                <StyledTrezorLink variant="underline" href={TOS_URL}>
                                    {chunks}
                                </StyledTrezorLink>
                            ),
                        }}
                    />
                </Description>

                <CollapsibleBox heading={<Translation id="TR_WHAT_DATA_WE_COLLECT" />}>
                    <Category>
                        {collectedData.map((category, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <React.Fragment key={i}>
                                <CategoryName>{category.name}</CategoryName>
                                <CategoryItems>
                                    {category.items.map(item => (
                                        <CategoryItem>{item}</CategoryItem>
                                    ))}
                                </CategoryItems>
                            </React.Fragment>
                        ))}
                    </Category>
                </CollapsibleBox>

                <SwitchWrapper>
                    <Switch
                        data-test="@analytics/toggle-switch"
                        checked={!!enabled}
                        onChange={() => {
                            if (enabled) {
                                return dispose();
                            }
                            enable();
                        }}
                    />
                    <Label>
                        <Translation id="TR_ONBOARDING_ALLOW_ANALYTICS" />
                    </Label>
                </SwitchWrapper>

                <ButtonWrapper>
                    <OnboardingButton.Cta
                        data-test="@onboarding/button-continue"
                        onClick={() => goToSubStep('security-check')}
                    >
                        <Translation id="TR_CONFIRM" />
                    </OnboardingButton.Cta>
                </ButtonWrapper>
            </Wrapper>
        </Box>
    );
};

export default DataAnalytics;
