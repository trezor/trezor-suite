import React from 'react';
import styled from 'styled-components';
import { useSpring, useTransition, config, animated } from 'react-spring';
import { Switch, Button, variables } from '@trezor/components';
import { useAnalytics, useOnboarding } from '@suite-hooks';
import { Translation } from '@suite-components';
import { Box } from '@onboarding-components';

const Wrapper = styled(animated.div)`
    display: flex;
    flex-direction: column;
`;

const SwitchWrapper = styled.div`
    display: flex;
`;

const Label = styled.span`
    margin-left: 20px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const DataAnalytics = () => {
    const { enable, dispose, enabled } = useAnalytics();
    const { goToSubStep } = useOnboarding();
    const fadeStyles = useSpring({
        config: { ...config.default },
        from: { opacity: 0 },
        to: { opacity: 1 },
    });

    return (
        <Wrapper>
            <Box style={fadeStyles}>
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
                <Button
                    data-test="@onboarding/button-continue"
                    onClick={() => goToSubStep('security-check')}
                >
                    <Translation id="TR_CONFIRM" />
                </Button>
            </Box>
        </Wrapper>
    );
};

export default DataAnalytics;
