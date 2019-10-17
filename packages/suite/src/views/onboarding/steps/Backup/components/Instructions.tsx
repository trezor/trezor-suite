import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Icon } from '@trezor/components';
import { Text } from '@onboarding-components';
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

const Instructions = () => (
    <Wrapper>
        <Instruction>
            <Icon size={80} icon="CLOUD_CROSSED" />
            <Text>
                <FormattedMessage {...l10nMessages.TR_DO_NOT_UPLOAD_INSTRUCTION} />
            </Text>
        </Instruction>

        <Instruction>
            <Icon size={80} icon="DOWNLOAD_CROSSED" />
            <Text>
                <FormattedMessage {...l10nMessages.TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION} />
            </Text>
        </Instruction>

        <Instruction>
            <Icon size={80} icon="PHOTO_CROSSED" />
            <Text>
                <FormattedMessage {...l10nMessages.TR_DO_NOT_TAKE_PHOTO_INSTRUCTION} />
            </Text>
        </Instruction>
    </Wrapper>
);

export default Instructions;
