import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { Icon, P } from '@trezor/components';
import l10nMessages from './Instructions.messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    width: 90%;
    justify-content: space-around;
    margin-top: 10px;
    margin-bottom: 10px;
`;

const Instruction = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Instructions = () => {
    const list = [
        {
            icon: 'CLOUD_CROSSED',
            message: l10nMessages.TR_DO_NOT_UPLOAD_INSTRUCTION,
        },
        {
            icon: 'DOWNLOAD_CROSSED',
            message: l10nMessages.TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION,
        },
        {
            icon: 'PHOTO_CROSSED',
            message: l10nMessages.TR_DO_NOT_TAKE_PHOTO_INSTRUCTION,
        },
    ] as const;
    return (
        <Wrapper>
            {list.map(i => (
                <Instruction key={i.icon}>
                    <Icon size={80} icon={i.icon} />
                    <P size="small">
                        <Translation {...i.message} />
                    </P>
                </Instruction>
            ))}
        </Wrapper>
    );
};

export default Instructions;
