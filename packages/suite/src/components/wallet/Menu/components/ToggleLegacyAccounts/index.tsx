import React, { useState } from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, Icon } from '@trezor/components-v2';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    display: flex;
    padding: 0px 12px;
    margin: 8px 0px;
    cursor: pointer;
    justify-content: space-between;
    align-items: center;

    text-transform: uppercase;
    font-size: 12px;
    font-weight: 600;
    color: ${colors.BLACK50};

    /* &:hover {
        color: ${colors.BLACK25};
    } */
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
            <Translation {...messages.TR_LEGACY_ACCOUNTS} />
            <Icon
                canAnimate={touched}
                isActive={isOpen}
                size={12}
                color={colors.BLACK50}
                icon="ARROW_DOWN"
            />
        </Wrapper>
    );
};

export default Toggle;
