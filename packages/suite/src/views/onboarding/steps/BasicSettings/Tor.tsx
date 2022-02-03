import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { variables, Input, Switch } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Translation } from '@suite-components';
import { useAnalytics } from '@suite-hooks';

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

const InputWrapper = styled.div`
    display: flex;
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
    const analytics = useAnalytics();
    const [torAddress, setTorAddress] = useState('');
    useEffect(() => {
        desktopApi.getTorAddress().then(setTorAddress);
    }, [setTorAddress]);

    const saveTorAddress = useCallback(() => {
        desktopApi.setTorAddress(torAddress);
    }, [torAddress]);

    return (
        <TorWrapper>
            <Label>
                <Translation id="TR_TOR_PARAM_TITLE" />
            </Label>
            <InputWrapper>
                <Input
                    noTopLabel
                    noError
                    value={torAddress}
                    onChange={(event: React.FormEvent<HTMLInputElement>) =>
                        setTorAddress(event.currentTarget.value)
                    }
                    onBlur={saveTorAddress}
                    data-test="@onboarding/tor-address"
                    placeholder="127.0.0.1:9050"
                />
            </InputWrapper>
            <SwitchWrapper>
                <Switch
                    data-test="@onboarding/tor-switch"
                    checked={tor}
                    onChange={() => {
                        analytics.report({
                            type: 'menu/toggle-tor',
                            payload: {
                                value: !tor,
                            },
                        });
                        desktopApi.toggleTor(!tor);
                    }}
                />
            </SwitchWrapper>
        </TorWrapper>
    );
};

export default Tor;
