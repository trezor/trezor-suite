import React from 'react';
import { Dropdown, Icon, useTheme, variables } from '@trezor/components';
import { Translation, TrezorLink } from '@suite-components';
import styled from 'styled-components';
import { useSelector } from '@suite-hooks';
import { FEEDBACK_FORM, SUPPORT_URL } from '@suite-constants/urls';

const Wrapper = styled.div`
    display: flex;
    position: fixed;
    z-index: 10;
    bottom: 18px;
    right: 18px;
`;

const BetaButton = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.TINY};
    padding: 4px 8px;
    border-radius: 3px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    border: solid 1px ${props => props.theme.TYPE_LIGHT_GREY};
    text-transform: uppercase;
    cursor: pointer;
`;

const Version = styled.div`
    display: flex;
    width: 100%;
    margin: 8px 16px 0px 16px;
    padding: 16px 0px 8px 0px;
    border-top: solid 1px ${props => props.theme.STROKE_GREY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledLink = styled(TrezorLink)`
    padding: 10px 16px;
    width: 100%;
`;

const IconWrapper = styled.div`
    margin-right: 16px;
`;

const BetaBadge = () => {
    const theme = useTheme();
    const instanceId = useSelector(state => state.analytics.instanceId);
    return (
        <Wrapper>
            <Dropdown
                alignMenu="top-right"
                items={[
                    {
                        key: 'group1',
                        options: [
                            {
                                key: 'feedback',
                                label: (
                                    <StyledLink
                                        size="small"
                                        variant="nostyle"
                                        href={`${FEEDBACK_FORM}#u=${instanceId}`}
                                    >
                                        <IconWrapper>
                                            <Icon
                                                icon="FEEDBACK"
                                                size={16}
                                                color={theme.TYPE_DARK_GREY}
                                            />
                                        </IconWrapper>
                                        <Translation id="TR_GIVE_FEEDBACK" />
                                    </StyledLink>
                                ),
                                noPadding: true,
                                callback: () => true,
                            },
                            {
                                key: 'support',
                                label: (
                                    <StyledLink size="small" variant="nostyle" href={SUPPORT_URL}>
                                        <IconWrapper>
                                            <Icon
                                                icon="SUPPORT"
                                                size={16}
                                                color={theme.TYPE_DARK_GREY}
                                            />
                                        </IconWrapper>
                                        <Translation id="TR_SUPPORT" />
                                    </StyledLink>
                                ),
                                noPadding: true,
                                callback: () => true,
                            },
                            {
                                key: 'version',
                                label: <Version>Version: {process.env.VERSION}</Version>,
                                noPadding: true,
                                noHover: true,
                                isDisabled: true,
                            },
                        ],
                    },
                ]}
            >
                <BetaButton>Beta</BetaButton>
            </Dropdown>
        </Wrapper>
    );
};

export default BetaBadge;
