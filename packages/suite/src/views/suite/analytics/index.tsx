import React from 'react';
import styled from 'styled-components';

import { Button, P, Modal, Link, variables, colors } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { Analytics } from '@suite-components/Settings';
import { URLS } from '@suite-constants';
import { Translation, Image } from '@suite-components';
import { useActions } from '@suite-hooks';

const { FONT_SIZE, FONT_WEIGHT } = variables;

const Body = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const BottomBarWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: auto;
`;

const StyledP = styled(P)`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.BLACK50};
`;

const BottomP = styled(P)`
    margin-top: 8px;
`;

const Bold = styled.span`
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK50};
`;

const StyledButton = styled(Button)`
    margin-top: 16px;
`;

const AnalyticsComponent = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    return (
        <Modal
            useFixedHeight
            heading={<Translation id="TR_HELP_TREZOR_SUITE" />}
            description={
                <>
                    <StyledP>
                        <Translation
                            id="TR_HELP_TREZOR_SUITE_TEXT_1"
                            values={{
                                TR_HELP_TREZOR_SUITE_TEXT_1_FAT: (
                                    <Bold>
                                        <Translation id="TR_HELP_TREZOR_SUITE_TEXT_1_FAT" />
                                    </Bold>
                                ),
                            }}
                        />
                    </StyledP>
                    <Bold>
                        <Translation id="TR_HELP_TREZOR_SUITE_TEXT_2" />
                    </Bold>
                </>
            }
            bottomBar={
                <BottomBarWrapper>
                    <StyledButton
                        onClick={() => goto('onboarding-index')}
                        data-test="@analytics/go-to-onboarding-button"
                    >
                        <Translation id="TR_CONTINUE" />
                    </StyledButton>
                    <BottomP size="tiny">
                        <Translation
                            id="TR_TOS_INFORMATION"
                            values={{
                                TR_TOS_LINK: (
                                    <Link href={URLS.TOS_URL}>
                                        <Translation id="TR_TOS_LINK" />
                                    </Link>
                                ),
                            }}
                        />
                    </BottomP>
                </BottomBarWrapper>
            }
        >
            <Body>
                <Image image="ANALYTICS" />

                <Analytics />
            </Body>
        </Modal>
    );
};

export default AnalyticsComponent;
