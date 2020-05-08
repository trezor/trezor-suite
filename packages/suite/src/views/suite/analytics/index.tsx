import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { Button, P, H2, Modal, Link, variables, colors } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { Dispatch, InjectedModalApplicationProps } from '@suite-types';
import { Analytics } from '@suite-components/Settings';
import { URLS } from '@suite-constants';
import { Translation, Image } from '@suite-components';

const { FONT_SIZE, FONT_WEIGHT } = variables;

const Body = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledP = styled(P)`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.BLACK50};
`;

const BottomP = styled(P)`
    margin-top: auto;
`;

const Bold = styled.span`
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK50};
`;

const StyledImg = styled(props => <Image {...props} />)`
    margin: 24px;
`;

const StyledButton = styled(Button)`
    margin-top: 16px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & InjectedModalApplicationProps;

const Index = (props: Props) => {
    return (
        <Modal
            useFixedHeight
            heading={
                <H2>
                    <Translation id="TR_HELP_TREZOR_SUITE" />
                </H2>
            }
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
        >
            <Body>
                <StyledImg image="ANALYTICS" />

                <Analytics />

                <StyledButton
                    onClick={() => props.goto('onboarding-index')}
                    data-test="@analytics/go-to-onboarding-button"
                >
                    <Translation id="TR_CONTINUE" />
                </StyledButton>
            </Body>

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
        </Modal>
    );
};

export default connect(null, mapDispatchToProps)(Index);
