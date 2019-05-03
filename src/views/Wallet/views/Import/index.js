/* @flow */

import React, { useState } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Select, Button, Input, Link, colors } from 'trezor-ui-components';
import l10nCommonMessages from 'views/common.messages';
import type { Props } from './Container';

const Wrapper = styled.div`
    text-align: left;
    flex-direction: column;
    display: flex;
    padding: 24px;
    min-width: 300px;
`;

const StyledSelect = styled(Select)`
    min-width: 100px;
`;

const InputRow = styled.div`
    margin-bottom: 16px;
`;

const Label = styled.div`
    color: ${colors.TEXT_SECONDARY};
    padding-bottom: 10px;
`;

const ButtonActions = styled.div`
    display: flex;
    flex-direction: row;

    justify-content: flex-end;
`;

const ButtonWrapper = styled.div`
    & + & {
        margin-left: 10px;
    }
`;

const Import = (props: Props) => {
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [address, setAddress] = useState('');

    const { networks } = props.config;
    return (
        // <LandingWrapper>
        <Wrapper>
            <InputRow>
                <Label>Select network</Label>
                <StyledSelect
                    value={selectedNetwork}
                    options={networks
                        .sort((a, b) => a.shortcut.localeCompare(b.shortcut))
                        .map(net => ({
                            label: net.shortcut,
                            value: net,
                        }))}
                    onChange={option => setSelectedNetwork(option)}
                />
            </InputRow>

            <InputRow>
                <Input
                    topLabel="Address"
                    name="cryptoAddress"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    type="text"
                />
            </InputRow>
            <ButtonActions>
                <ButtonWrapper>
                    <Link to="/">
                        <Button isWhite>
                            <FormattedMessage {...l10nCommonMessages.TR_CLOSE} />
                        </Button>
                    </Link>
                </ButtonWrapper>

                <ButtonWrapper>
                    <Button
                        isDisabled={
                            !selectedNetwork || address === '' || props.importAccount.loading
                        }
                        isLoading={props.importAccount.loading}
                        onClick={() =>
                            props.importAddress(
                                address,
                                (selectedNetwork || {}).value,
                                props.device
                            )
                        }
                    >
                        Import
                    </Button>
                </ButtonWrapper>
            </ButtonActions>
        </Wrapper>
        // </LandingWrapper>
    );
};
export default Import;
