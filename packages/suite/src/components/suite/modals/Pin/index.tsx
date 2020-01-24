import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { P, H2, Link } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import Loading from '@suite-components/Loading';
import { PinInput } from '@suite-components';
import { Dispatch, TrezorDevice } from '@suite-types';
import messages from '@suite/support/messages';
import { URLS } from '@suite-constants';
import * as modalActions from '@suite-actions/modalActions';

const ModalWrapper = styled.div`
    padding: 30px 45px;
    width: 356px;
`;

const TopMessage = styled(P)``;

const BottomMessage = styled(P)`
    margin: 20px 30px 0;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onPinSubmit: bindActionCreators(modalActions.onPinSubmit, dispatch),
});

type Props = {
    device: TrezorDevice;
} & ReturnType<typeof mapDispatchToProps>;

const Pin = ({ device, onPinSubmit }: Props) => {
    const [submitted, setSubmitted] = useState(false);
    if (submitted) {
        return <Loading />;
    }

    const submit = (value: string) => {
        if (submitted) return;
        setSubmitted(true);
        onPinSubmit(value);
    };

    return (
        <ModalWrapper>
            <H2>
                <Translation
                    {...messages.TR_ENTER_PIN}
                    values={{
                        deviceLabel: device.label,
                    }}
                />
            </H2>
            <TopMessage size="small">
                <Translation {...messages.TR_THE_PIN_LAYOUT_IS_DISPLAYED} />
            </TopMessage>
            <PinInput onPinSubmit={submit} />
            <BottomMessage size="small">
                <Translation {...messages.TR_HOW_PIN_WORKS} />{' '}
                <Link href={URLS.PIN_MANUAL_URL}>
                    <Translation {...messages.TR_LEARN_MORE_LINK} />
                </Link>
            </BottomMessage>
        </ModalWrapper>
    );
};

export default connect(null, mapDispatchToProps)(Pin);
