import React, { useState } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button } from '@trezor/components';
import { Translation, Loading, Image } from '@suite-components';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changePin: bindActionCreators(deviceSettingsActions.changePin, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & {
    onCancel: () => void;
};

const StyledImage = styled(Image)`
    flex: 1;
`;

const PinMismatch = ({ changePin }: Props) => {
    const [submitted, setSubmitted] = useState(false);

    const onTryAgain = () => {
        setSubmitted(true);
        changePin({});
    };

    if (submitted) {
        return <Loading />;
    }

    return (
        <Modal
            size="tiny"
            heading={<Translation id="TR_PIN_MISMATCH_HEADING" />}
            description={<Translation id="TR_PIN_MISMATCH_TEXT" />}
        >
            <StyledImage image="UNI_ERROR" />
            <Button onClick={onTryAgain}>
                <Translation id="TR_TRY_AGAIN" />
            </Button>
        </Modal>
    );
};

export default connect(null, mapDispatchToProps)(PinMismatch);
