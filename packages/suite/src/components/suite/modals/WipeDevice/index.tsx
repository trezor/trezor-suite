import React, { useState } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { P, H2, Button } from '@trezor/components';
import { Translation, CheckItem, Image } from '@suite-components';

import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import ModalWrapper from '@suite-components/ModalWrapper';
import { Dispatch, AppState } from '@suite-types';
import { SUITE } from '@suite-actions/constants';

const Wrapper = styled(ModalWrapper)`
    flex-direction: column;
    max-width: 80vw;
    min-height: 60vh;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;

const Texts = styled.div`
    max-width: 600px;
    margin-bottom: 24px;
`;

const CheckItems = styled(Row)`
    justify-content: center;
    margin-top: 32px;
`;

const Buttons = styled(Row)`
    justify-content: center;
    margin-top: auto;
`;

const StyledButton = styled(Button)`
    margin: 24px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    wipeDevice: bindActionCreators(deviceSettingsActions.wipeDevice, dispatch),
});

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
});

type Props = ReturnType<typeof mapDispatchToProps> &
    ReturnType<typeof mapStateToProps> & {
        onCancel: () => void;
    };

const WipeDevice = ({ locks, wipeDevice, onCancel }: Props) => {
    const [checkbox1, setCheckbox1] = useState(false);
    const [checkbox2, setCheckbox2] = useState(false);
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);

    return (
        <Wrapper>
            <Texts>
                <H2>
                    <Translation id="TR_WIPE_DEVICE_HEADING" />
                </H2>
                <P size="tiny">
                    <Translation id="TR_WIPE_DEVICE_TEXT" />
                </P>
            </Texts>
            <Image image="UNI_ERROR" />
            <CheckItems>
                <Col>
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION" />}
                        isChecked={checkbox1}
                        onClick={() => setCheckbox1(!checkbox1)}
                        data-test="@wipe/checkbox-1"
                    />
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION" />}
                        isChecked={checkbox2}
                        onClick={() => setCheckbox2(!checkbox2)}
                        data-test="@wipe/checkbox-2"
                    />
                </Col>
            </CheckItems>

            <Buttons>
                <Col>
                    <StyledButton
                        variant="danger"
                        onClick={() => wipeDevice()}
                        isDisabled={uiLocked || !checkbox1 || !checkbox2}
                        data-test="@wipe/wipe-button"
                    >
                        <Translation id="TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE" />
                    </StyledButton>
                    <StyledButton icon="CROSS" variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </StyledButton>
                </Col>
            </Buttons>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(WipeDevice);
