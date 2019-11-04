import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';

import { H5, P, Button } from '@trezor/components';

import globalMessages from '@suite-support/Messages';
import l10nMessages from './messages';

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
            <H5>
                <FormattedMessage
                    {...l10nMessages.TR_REQUEST_INSTANCE_HEADER}
                    values={{
                        deviceLabel: `${device.label} (${instance})`,
                    }}
                />
            </H5>
            <StyledP size="small">
                <FormattedMessage {...l10nMessages.TR_REQUEST_INSTANCE_DESCRIPTION} />
            </StyledP>
            <Row>
                <Button onClick={() => onCreateInstance(device)}>
                    <FormattedMessage {...l10nMessages.TR_CREATE_INSTANCE} />
                </Button>
                <Button variant="white" onClick={onCancel}>
                    <FormattedMessage {...globalMessages.TR_CANCEL} />
                </Button>
            </Row>
        </Wrapper>
    );
};

export default RequestInstance;
