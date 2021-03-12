import React from 'react';
import styled from 'styled-components';
import { Button, Icon, Tooltip, variables } from '@trezor/components';
import { useOnboarding, useTheme } from '@suite-hooks';
import { Translation } from '@suite/components/suite';
import { Box, Hologram } from '@onboarding-components';

const Items = styled.div`
    display: flex;
    flex-direction: column;
`;
const Item = styled.div`
    display: flex;
    align-items: center;

    & + & {
        margin-top: 24px;
    }
`;

const Underline = styled.span`
    /* text-decoration: dashed; */
    text-decoration: underline;
    text-decoration-style: dashed;
`;

const Buttons = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Text = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: 24px;
`;

const StyledButton = styled(Button)`
    min-width: 180px;
    & + & {
        margin-left: 16px;
    }
`;
const StyledTooltip = styled(Tooltip)`
    display: inline-block;
`;
interface Props {
    initialized: boolean;
    trezorModel: number;
}

const SecurityCheck = ({ initialized, trezorModel }: Props) => {
    const { goToNextStep, goto } = useOnboarding();
    const { theme } = useTheme();
    // TODO: Maybe we could provide separate sets of texts for initialize device?
    return (
        <Box image="PIN" heading={<Translation id="TR_ONBOARDING_DEVICE_CHECK" />}>
            <Items>
                <Item>
                    <Icon size={24} icon="HOLOGRAM" color={theme.TYPE_DARK_GREY} />
                    <Text>
                        <Translation
                            id="TR_ONBOARDING_DEVICE_CHECK_1"
                            values={{
                                strong: chunks => (
                                    <StyledTooltip content={<Hologram trezorModel={trezorModel} />}>
                                        <Underline>{chunks}</Underline>
                                    </StyledTooltip>
                                ),
                            }}
                        />
                    </Text>
                </Item>
                <Item>
                    <Icon size={24} icon="VERIFIED" color={theme.TYPE_DARK_GREY} />
                    <Text>
                        <Translation id="TR_ONBOARDING_DEVICE_CHECK_2" />
                    </Text>
                </Item>
                <Item>
                    <Icon size={24} icon="PACKAGE" color={theme.TYPE_DARK_GREY} />
                    <Text>
                        <Translation id="TR_ONBOARDING_DEVICE_CHECK_3" />
                    </Text>
                </Item>
            </Items>

            <Buttons>
                {initialized ? (
                    <StyledButton
                        data-test="@onboarding/exit-app-button"
                        onClick={() => goto('suite-index')}
                    >
                        <Translation id="TR_GO_TO_SUITE" />
                    </StyledButton>
                ) : (
                    <StyledButton onClick={() => goToNextStep()}>
                        <Translation id="TR_ONBOARDING_START_CTA" />
                    </StyledButton>
                )}
                <StyledButton variant="secondary">velky spatny</StyledButton>
            </Buttons>
        </Box>
    );
};

export default SecurityCheck;
