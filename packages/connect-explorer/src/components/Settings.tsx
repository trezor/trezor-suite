import styled from 'styled-components';

import { Button } from '@trezor/components';

import * as trezorConnectActions from '../actions/trezorConnectActions';
import { useSelector, useActions } from '../hooks';

import { Row } from './fields/Row';
import { getField } from './Method';
import { Field, FieldWithBundle } from '../types';

const SettingsContent = styled.section`
    flex: 1;
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
`;

export const Settings = () => {
    const connectOptions = useSelector(state => ({
        trustedHost: state.connect?.options?.trustedHost || false,
    }));
    const actions = useActions({
        onSubmitInit: trezorConnectActions.onSubmitInit,
        onFieldChange: trezorConnectActions.onConnectOptionChange,
    });

    const submitButton = 'Init Connect';
    const fields: (Field<any> | FieldWithBundle<any>)[] = [
        {
            name: 'trustedHost',
            type: 'checkbox',
            key: 'trustedHost',
            value: connectOptions?.trustedHost || false,
        },
    ];

    return (
        <SettingsContent>
            {fields.map(field => getField(field, { actions }))}
            <Row>
                <Button onClick={actions.onSubmitInit} data-test="@submit-button">
                    {submitButton}
                </Button>
            </Row>
        </SettingsContent>
    );
};
