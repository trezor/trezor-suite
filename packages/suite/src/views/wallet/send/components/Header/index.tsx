import React from 'react';
import styled from 'styled-components';
import { variables, Dropdown } from '@trezor/components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import Clear from './components/Clear';

const Wrapper = styled.div`
    display: flex;
    margin-bottom: 20px;
`;

const HeaderLeft = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
`;

const Header = () => {
    const {
        outputs,
        account: { networkType },
        addOpReturn,
        loadTransaction,
    } = useSendFormContext();

    const { sendRaw } = useActions({
        sendRaw: sendFormActions.sendRaw,
    });

    const opreturnOutput = (outputs || []).find(o => o.type === 'opreturn');
    const options = [
        {
            key: 'opreturn',
            'data-test': '@send/header-dropdown/opreturn',
            callback: addOpReturn,
            label: <Translation id="OP_RETURN_ADD" />,
            isDisabled: !!opreturnOutput,
            isHidden: networkType !== 'bitcoin',
        },
        {
            key: 'import',
            callback: () => {
                loadTransaction();
                return true;
            },
            label: <Translation id="IMPORT_CSV" />,
            isHidden: networkType !== 'bitcoin',
        },
        {
            key: 'raw',
            callback: () => {
                sendRaw(true);
                return true;
            },
            label: <Translation id="SEND_RAW" />,
        },
    ];

    return (
        <Wrapper>
            <HeaderLeft />
            <HeaderRight>
                <Clear />
                <Dropdown
                    alignMenu="right"
                    data-test="@send/header-dropdown"
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

export default Header;
