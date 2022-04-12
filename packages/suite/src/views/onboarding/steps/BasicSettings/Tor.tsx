import React from 'react';
import styled from 'styled-components';
import { variables, Switch } from '@trezor/components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { toggleTor as toggleTorAction } from '@suite-actions/suiteActions';

const TorWrapper = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 3fr 0.5fr;
    grid-template-rows: 1fr;
    gap: 9px 54px;
    padding: 9px 0 0 0;
    margin: 0 0 12px 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Label = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-weight: 500;
    padding-top: 11px;
`;

const SwitchWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

interface Props {
    tor: boolean;
}

const Tor = ({ tor }: Props) => {
    const { toggleTor } = useActions({
        toggleTor: toggleTorAction,
    });

    return (
        <TorWrapper>
            <Label>
                <Translation id="TR_TOR_ENABLE_TITLE" />
            </Label>
            <SwitchWrapper>
                <Switch
                    data-test="@onboarding/tor-switch"
                    checked={tor}
                    onChange={() => {
                        toggleTor(!tor);
                    }}
                />
            </SwitchWrapper>
        </TorWrapper>
    );
};

export default Tor;
