import React, { FunctionComponent } from 'react';
import { Translation } from '@suite-components/Translation';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';
import messages from '@suite/support/messages';
import { Button, H2, P } from '@trezor/components-v2';
import { AcquiredDevice } from '@suite-types';

interface Props {
    device: AcquiredDevice;
    instance?: number;
    onCreateInstance: (device: AcquiredDevice) => void;
    onCancel: () => void;
}

const Wrapper = styled.div`
    width: 360px;
    padding: 30px 48px;
`;

const StyledP = styled(P)`
    && {
        padding: 20px 0px;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

const RequestInstance: FunctionComponent<Props> = ({
    device,
    instance,
    onCreateInstance,
    onCancel,
}) => {
    useHotkeys('enter', () => onCreateInstance(device));
    useHotkeys('esc', () => onCancel());

    return (
        <Wrapper>
            <H2>
                <Translation
                    {...messages.TR_REQUEST_INSTANCE_HEADER}
                    values={{
                        deviceLabel: `${device.label} (${instance})`,
                    }}
                />
            </H2>
            <StyledP size="small">
                <Translation {...messages.TR_REQUEST_INSTANCE_DESCRIPTION} />
            </StyledP>
            <Row>
                <Button onClick={() => onCreateInstance(device)} inlineWidth>
                    <Translation {...messages.TR_CREATE_INSTANCE} />
                </Button>
                <Button variant="secondary" onClick={onCancel} inlineWidth>
                    <Translation {...messages.TR_CANCEL} />
                </Button>
            </Row>
        </Wrapper>
    );
};

export default RequestInstance;
