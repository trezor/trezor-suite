import React, { useState } from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, Icon } from '@trezor/components';
import l10nMessages from '../../index.messages';

const Wrapper = styled.div`
    padding: 0px 15px;
    margin: 8px 0px;
    display: flex;
    cursor: pointer;
    justify-content: space-between;
    align-items: center;
    color: ${colors.TEXT_SECONDARY};
    transition: color 0.3s;
    &:hover {
        color: ${colors.TEXT_PRIMARY};
    }
`;

interface Props {
    onToggle: () => void;
    isOpen: boolean;
}

const Toggle = ({ onToggle, isOpen }: Props) => {
    const [touched, setTouched] = useState(false);
    return (
        <Wrapper
            onClick={() => {
                onToggle();
                setTouched(true);
            }}
        >
            <Translation {...l10nMessages.TR_LEGACY_ACCOUNTS} />
            <Icon
                canAnimate={touched}
                isActive={isOpen}
                size={12}
                color={colors.TEXT_SECONDARY}
                icon="ARROW_DOWN"
            />
        </Wrapper>
    );
};

export default Toggle;
