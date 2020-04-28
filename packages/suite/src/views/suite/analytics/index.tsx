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
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
`;

const BottomP = styled(P)`
    margin-top: auto;
`;

const Bold = styled.span`
    font-size: ${FONT_SIZE.TINY};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK50};
`;

const StyledImg = styled(props => <Image {...props} />)`
    flex: 1;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & InjectedModalApplicationProps;

const Index = (props: Props) => {
    return (
        <Modal useFixedHeight>
            <H2>
                <Translation id="TR_HELP_TREZOR_SUITE" />
            </H2>
            <Body>
                <P size="tiny">
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
                </P>
                <Bold>
                    <Translation id="TR_HELP_TREZOR_SUITE_TEXT_2" />
                </Bold>

                <StyledImg image="ANALYTICS" />

                <Analytics />

                <Button
                    onClick={() => props.goto('onboarding-index')}
                    data-test="@analytics/go-to-onboarding-button"
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
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
