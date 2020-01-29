import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { resolveStaticPath } from '@suite-utils/nextjs';
import { Button, P, H2, Link, variables, colors } from '@trezor/components-v2';
import * as routerActions from '@suite-actions/routerActions';
import { Dispatch, InjectedModalApplicationProps } from '@suite-types';
import { Analytics } from '@suite-components/Settings';
import { URLS } from '@suite-constants';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';

const { FONT_SIZE, FONT_WEIGHT } = variables;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto;
    padding: 90px 90px 40px 90px;
    justify-content: center;
    width: 780px;
    height: 680px;
`;

const BottomP = styled(P)`
    margin-top: auto;
`;

const Bold = styled.span`
    font-size: ${FONT_SIZE.TINY};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK50};
`;

const StyledImg = styled.img`
    margin-top: 23px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & InjectedModalApplicationProps;

const Index = (props: Props) => {
    return (
        <Wrapper>
            <H2>
                <Translation>{messages.TR_HELP_TREZOR_SUITE}</Translation>
            </H2>
            <P size="tiny">
                <Translation
                    {...messages.TR_HELP_TREZOR_SUITE_TEXT_1}
                    values={{
                        TR_HELP_TREZOR_SUITE_TEXT_1_FAT: (
                            <Bold>
                                <Translation>
                                    {messages.TR_HELP_TREZOR_SUITE_TEXT_1_FAT}
                                </Translation>
                            </Bold>
                        ),
                    }}
                />
            </P>
            <Bold>
                <Translation>{messages.TR_HELP_TREZOR_SUITE_TEXT_2}</Translation>
            </Bold>

            <StyledImg alt="" src={resolveStaticPath('images/welcome/analytics.svg')} />

            <Analytics />

            <Button
                onClick={() => props.goto('onboarding-index')}
                data-test="@button/go-to-onboarding"
            >
                <Translation>{messages.TR_CONTINUE}</Translation>
            </Button>

            <BottomP size="tiny">
                <Translation
                    {...messages.TR_TOS_INFORMATION}
                    values={{
                        TR_TOS_LINK: (
                            <Link href={URLS.TOS_URL}>
                                <Translation {...messages.TR_TOS_LINK} />
                            </Link>
                        ),
                    }}
                />
            </BottomP>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(Index);
