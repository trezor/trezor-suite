import React from 'react';
import styled from 'styled-components';
import { variables, colors, Dropdown } from '@trezor/components';
import { useActions } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import Clear from './components/Clear';

const Wrapper = styled.div`
    display: flex;
    padding: 6px 12px;
`;

const HeaderLeft = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
`;

export default () => {
    const {
        outputs,
        account: { networkType },
        addOpReturn,
        loadTransaction,
    } = useSendFormContext();

    const { importRequest, sendRaw } = useActions({
        importRequest: sendFormActions.importRequest,
        sendRaw: sendFormActions.sendRaw,
    });

    const opreturnOutput = (outputs || []).find(o => o.type === 'opreturn');
    const options = [
        {
            key: 'opreturn',
            callback: addOpReturn,
            label: 'Add OP Return',
            isDisabled: !!opreturnOutput,
            isHidden: networkType !== 'bitcoin',
        },
        {
            key: 'import',
            callback: () => {
                // since Dropdown needs to respond immediately to close itself
                // opening modal and processing the response needs to be wrapped
                const loadFile = async () => {
                    const result = await importRequest();
                    if (result) {
                        loadTransaction(result);
                        console.log('processing', result);
                    }
                };
                loadFile();
                return true;
            },
            label: 'Import',
            // isDisabled: true,
        },
        {
            key: 'raw',
            callback: () => {
                sendRaw(true);
                return true;
            },
            label: 'Send RAW',
            // isDisabled: true,
        },
    ];

    return (
        <Wrapper>
            <HeaderLeft />
            <HeaderRight>
                <Clear />
                <Dropdown
                    alignMenu="right"
                    items={[
                        {
                            key: 'header',
                            options,
                        },
                    ]}
                />
            </HeaderRight>
        </Wrapper>
    );
};
