import React, { useRef, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useSendFormContext } from '@wallet-hooks';
import { variables, Button } from '@trezor/components';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { requestSubmarineSwap, getInvoiceDetails } from '@trezor/lightning';

import { useSelector } from '@suite-hooks';

import Address from './components/Address';
import Amount from './components/Amount';
import OpReturn from './components/OpReturn';
import { ANIMATION } from '@suite-config';
import { Account } from '@suite/types/wallet';

const Wrapper = styled.div``;

const OutputWrapper = styled.div<{ index: number }>`
    display: flex;
    flex-direction: column;
    margin: 32px 42px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 32px 20px;
    }

    ${props =>
        props.index > 0 &&
        css`
            margin: 0 42px;
            padding-top: 32px;
            border-top: 1px solid ${props => props.theme.STROKE_GREY};
        `}
`;

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    padding: 0 0 10px 0;

    &:last-child {
        padding: 0;
    }
`;

interface OutputsProps {
    disableAnim?: boolean; // used in tests, with animations enabled react-testing-library can't find output fields
}

interface Swap {
    destination_public_key: string;
    fee_tokens_per_vbyte: number;
    invoice: string;
    payment_hash: string;
    redeem_script: string;
    refund_address: string;
    refund_public_key_hash: string;
    swap_amount: number;
    swap_fee: number;
    swap_key_index: number;
    swap_p2sh_address: string;
    swap_p2sh_p2wsh_address: string;
    swap_p2wsh_address: string;
    timeout_block_height: number;
}

const Outputs = ({ disableAnim }: OutputsProps) => {
    const { outputs } = useSendFormContext();
    const [renderedOutputs, setRenderedOutputs] = useState(1);

    const [bolt11PayRequest, setBolt11PayRequest] = useState();
    const [swapInfo, setSwapInfo] = useState();
    const [swap, setSwap] = useState({} as Swap);
    console.log('swap', swap);

    const lastOutputRef = useRef<HTMLDivElement | null>(null);
    const { selectedAccount } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));

    const onAddAnimationComplete = () => {
        // scrolls only on adding outputs, doesn't scroll on removing them
        if (outputs.length > 1 && outputs.length > renderedOutputs) {
            lastOutputRef?.current?.scrollIntoView({ behavior: 'smooth' });
        }

        setRenderedOutputs(outputs.length);
    };

    const getLnSwap = async () => {
        const swapInfoRes = await getInvoiceDetails(bolt11PayRequest.paymentRequest);
        setSwapInfo(swapInfoRes);
    };

    const createSubmarineSwap = async (account: Account | undefined, invoice: string) => {
        if (!account) {
            return;
        }
        const { address } = getUnusedAddressFromAccount(account);
        if (!address) {
            return;
        }
        const swapResponse = await requestSubmarineSwap(invoice, address);
        setSwap({
            ...swapResponse,
        });
    };

    useEffect(() => {
        if (outputs.length < renderedOutputs) {
            // updates rendered outputs count when removing an output
            // this is necessary because onAddAnimationComplete is not fired when removing 2nd output
            setRenderedOutputs(outputs.length);
        }
    }, [outputs.length, renderedOutputs, setRenderedOutputs]);

    const animation = outputs.length > 1 && !disableAnim ? ANIMATION.EXPAND : {}; // do not animate if there is only 1 output, prevents animation on clear

    return (
        <AnimatePresence initial={false}>
            <Wrapper>
                {outputs.map((output, index) => (
                    <motion.div
                        key={output.id}
                        {...animation}
                        onAnimationComplete={onAddAnimationComplete}
                    >
                        <OutputWrapper
                            ref={index === outputs.length - 1 ? lastOutputRef : undefined} // set ref to last output
                            index={index}
                        >
                            {output.type === 'opreturn' ? (
                                <OpReturn outputId={index} />
                            ) : (
                                <>
                                    <Row>
                                        <Address
                                            output={outputs[index]}
                                            outputId={index}
                                            outputsCount={outputs.length}
                                            setBolt11PayRequest={setBolt11PayRequest}
                                        />
                                    </Row>
                                    {bolt11PayRequest ? undefined : (
                                        <Row>
                                            <Amount output={outputs[index]} outputId={index} />
                                        </Row>
                                    )}

                                    {bolt11PayRequest && !swapInfo ? (
                                        <Row isColumn>
                                            <p>
                                                This is a lightning network invoice to pay{' '}
                                                {bolt11PayRequest.satoshis} satoshi
                                            </p>
                                            <p>You could use Trezor Swap service to pay for it.</p>
                                            <Button onClick={() => getLnSwap()}>
                                                Request more info
                                            </Button>
                                        </Row>
                                    ) : undefined}

                                    {bolt11PayRequest && swapInfo && !swap.invoice ? (
                                        // check if is_expired then it should display message that invoice has expired
                                        <Row isColumn>
                                            <p>You are going to send {swapInfo.tokens} satoshis</p>
                                            <p>To node {swapInfo.destination_public_key}</p>
                                            <p>
                                                The fee for the service will be {swapInfo.fee}{' '}
                                                satoshis ({swapInfo.fee_fiat_value / 100}{' '}
                                                {swapInfo.fiat_currency_code})
                                            </p>
                                            <p>
                                                The swap transaction might fail, if it fails you
                                                will get the amount in the same account after 2
                                                weeks
                                            </p>
                                            <Button
                                                onClick={() =>
                                                    createSubmarineSwap(
                                                        selectedAccount.account,
                                                        bolt11PayRequest.paymentRequest,
                                                    )
                                                }
                                            >
                                                Request submarine swap
                                            </Button>
                                        </Row>
                                    ) : undefined}

                                    {swap.invoice ? (
                                        <Row isColumn>
                                            <div>Pay atomic submarine swap</div>
                                            <div>
                                                If it faill you will get the amount back to{' '}
                                                {swap.refund_address}
                                            </div>
                                        </Row>
                                    ) : undefined}
                                </>
                            )}
                        </OutputWrapper>
                    </motion.div>
                ))}
            </Wrapper>
        </AnimatePresence>
    );
};

export default Outputs;
