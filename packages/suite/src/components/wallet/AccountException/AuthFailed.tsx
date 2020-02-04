import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { colors, variables, H2, Button } from '@trezor/components-v2';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch } from '@suite-types';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
`;

const Title = styled(H2)`
    display: flex;
    text-align: center;
    color: ${colors.BLACK0};
`;

const Description = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: center;
    color: ${colors.BLACK50};
    margin-bottom: 10px;
`;

const Image = styled.img`
    width: 340px;
    height: 280px;
    margin-bottom: 40px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
`;

const ActionButton = styled(Button)`
    min-width: 160px;
`;

const mapStateToProps = (state: AppState) => ({
    locked:
        state.suite.locks.includes(SUITE.LOCK_TYPE.DEVICE) ||
        state.suite.locks.includes(SUITE.LOCK_TYPE.UI),
    toast: state.notifications.find(n => n.type === 'auth-failed'),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    authDevice: bindActionCreators(suiteActions.authorizeDevice, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const AuthFailed = ({ locked, authDevice }: Props) => {
    return (
        <Content>
            <Title>Authorization error</Title>
            {/* {toast && <Description>{toast.error}</Description>} */}
            <Description>Error generic text</Description>
            <Image src={resolveStaticPath(`images/wallet/wallet-empty.svg`)} />
            <Actions>
                <ActionButton
                    variant="primary"
                    isLoading={locked}
                    disabled={locked}
                    onClick={authDevice}
                >
                    Retry
                </ActionButton>
            </Actions>
        </Content>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthFailed);
