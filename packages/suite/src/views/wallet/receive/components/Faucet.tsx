import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { variables, Select, Input, Button } from '@trezor/components';
import { Card } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { REGTEST_URL } from '@suite/services/coinjoin/config';
import type { AccountAddress } from '@trezor/connect';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin: 12px 0px;
`;

const Row = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-bottom: 10px;
`;

export const generateBlock = () =>
    fetch(`${REGTEST_URL}generate_block`, {
        method: 'GET',
    });

export const startAutoBlockGen = () =>
    fetch(`${REGTEST_URL}start_generating_blocks_automatically`, {
        method: 'POST',
        body: 'interval_in_seconds=10',
    });

export const stopAutoBlockGen = () =>
    fetch(`${REGTEST_URL}stop_generating_blocks_automatically`, {
        method: 'POST',
    });

export const sendToAddress = (address: string, amount: string) =>
    fetch(`${REGTEST_URL}send_to_address`, {
        method: 'POST',
        body: new URLSearchParams({
            address,
            amount,
        }).toString(),
    });

const buildAddressOption = (address: AccountAddress) =>
    ({
        value: address.address,
        label: `${address.path} ${address.address}`,
    } as const);

type Option = ReturnType<typeof buildAddressOption>;

export const Faucet = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const amountRef = useRef<HTMLInputElement | null>(null);
    const [address, setAddress] = useState<Option | null>(null);

    if (!selectedAccount.account || !selectedAccount.account.addresses) return null;
    if (selectedAccount.account.accountType !== 'coinjoin') return null;

    const options = selectedAccount.account.addresses.unused.map(buildAddressOption);
    const selected = address || options[0];

    return (
        <StyledCard>
            <Row>
                <Select
                    label={<span>Faucet</span>}
                    isSearchable={false}
                    isClearable={false}
                    value={selected}
                    options={options}
                    onChange={(option: Option) => setAddress(option)}
                />
            </Row>
            <Row>
                <Input
                    noTopLabel
                    noError
                    innerRef={amountRef}
                    dataTest="@wallet/coinjoin/faucet/amount"
                />
                <Button
                    disabled={!selected}
                    onClick={() => {
                        if (selected && amountRef.current?.value) {
                            sendToAddress(selected.value, amountRef.current?.value);
                        }
                    }}
                    data-test="@wallet/coinjoin/faucet/send"
                >
                    Receive coins
                </Button>
            </Row>
            <Row>
                <Button
                    onClick={() => generateBlock()}
                    data-test="@wallet/coinjoin/faucet/mine-block"
                >
                    Generate block
                </Button>
                {/* <Button
                    onClick={() => startAutoBlockGen()}
                    data-test="@wallet/coinjoin/faucet/start-auto-block-gen"
                >
                    Start auto generate block
                </Button>
                <Button
                    onClick={() => stopAutoBlockGen()}
                    data-test="@wallet/coinjoin/faucet/stop-auto-block-gen"
                >
                    Stop auto generate block
                </Button> */}
            </Row>
        </StyledCard>
    );
};
