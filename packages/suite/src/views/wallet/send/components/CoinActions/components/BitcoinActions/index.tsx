import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { OnOffSwitcher } from '@wallet-components';
import { Button } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';

import Locktime from './components/Locktime';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Top = styled.div``;

const Row = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const StyledButton = styled(Button)`
    margin-right: 8px;
`;

export default () => {
    const { addOutput } = useSendFormContext();
    const [broadcastActive, setBroadcastActive] = useState<boolean>(false);
    const [locktimeActive, setLocktimeActive] = useState<boolean>(false);
    const [rbfActive, setRbfActive] = useState<boolean>(false);

    return (
        <Wrapper>
            <Top>{locktimeActive && <Locktime setIsActive={setLocktimeActive} />}</Top>
            <Row>
                <Left>
                    {!locktimeActive && (
                        <StyledButton
                            variant="tertiary"
                            icon="CALENDAR"
                            onClick={() => {
                                setLocktimeActive(true);
                            }}
                        >
                            <Translation id="TR_ADD_LOCKTIME" />
                        </StyledButton>
                    )}
                    <StyledButton
                        variant="tertiary"
                        icon="RBF"
                        onClick={() => {
                            setBroadcastActive(!broadcastActive);
                        }}
                    >
                        <Translation id="TR_BROADCAST" />
                        <OnOffSwitcher isOn={broadcastActive} />
                    </StyledButton>
                    <StyledButton
                        variant="tertiary"
                        icon="RBF"
                        onClick={() => {
                            setRbfActive(!rbfActive);
                        }}
                    >
                        <Translation id="TR_RBF" />
                        <OnOffSwitcher isOn={rbfActive} />
                    </StyledButton>
                </Left>
                <Right>
                    <Button
                        variant="tertiary"
                        icon="PLUS"
                        data-test="add-output"
                        onClick={addOutput}
                    >
                        <Translation id="TR_ANOTHER_RECIPIENT" />
                    </Button>
                </Right>
            </Row>
        </Wrapper>
    );
};
