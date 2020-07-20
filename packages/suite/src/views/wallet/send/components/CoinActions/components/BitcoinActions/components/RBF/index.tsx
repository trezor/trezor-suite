import React from 'react';
import styled from 'styled-components';
import { Translation, OnOff } from '@suite-components';
import { OnOffSwitcher } from '@wallet-components';
import { Button, colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    margin-left: 8px;
`;

interface Props {
    isOn: boolean;
    isActive: boolean;
    setIsActive: (isActive: boolean) => void;
}

const RBF = ({ isActive = false, isOn = true, setIsActive }: Props) => {
    return (
        <Wrapper>
            {!isActive && (
                <Button
                    variant="tertiary"
                    icon="RBF"
                    onClick={() => {
                        setIsActive(true);
                    }}
                >
                    <Translation id="TR_RBF" />
                    <OnOffSwitcher isOn={isOn} />
                </Button>
            )}
        </Wrapper>
    );
};

export default RBF;
