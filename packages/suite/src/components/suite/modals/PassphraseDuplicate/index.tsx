import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { variables, colors, Button } from '@trezor/components-v2';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import ModalWrapper from '../../ModalWrapper';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    switchDuplicatedDevice: bindActionCreators(suiteActions.switchDuplicatedDevice, dispatch),
    authorizeDevice: bindActionCreators(suiteActions.authorizeDevice, dispatch),
});

type Props = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const Wrapper = styled(ModalWrapper)`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 360px;
`;

const Title = styled.div`
    max-width: 80%;
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
    color: ${colors.BLACK0};
    margin-bottom: 20px;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
    color: ${colors.BLACK50};
    margin-bottom: 4px;
`;

const Actions = styled.div`
    width: 100%;
    button + button {
        margin-top: 8px;
    }
`;

const PassphraseDuplicate = ({
    locks,
    device,
    duplicate,
    switchDuplicatedDevice,
    authorizeDevice,
}: Props) => {
    const progress = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <Wrapper>
            <Title>
                <Translation {...messages.TR_WALLET_DUPLICATE_TITLE} />
            </Title>
            <Description>
                <Translation {...messages.TR_WALLET_DUPLICATE_DESC} />
            </Description>
            <DeviceConfirmImage device={device} />
            <Actions>
                <Button
                    variant="primary"
                    onClick={() => switchDuplicatedDevice(device, duplicate)}
                    isLoading={progress}
                    fullWidth
                >
                    <Translation {...messages.TR_WALLET_DUPLICATE_SWITCH} />
                </Button>
                <Button
                    variant="secondary"
                    onClick={authorizeDevice}
                    isLoading={progress}
                    fullWidth
                >
                    <Translation {...messages.TR_WALLET_DUPLICATE_RETRY} />
                </Button>
            </Actions>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(PassphraseDuplicate);
