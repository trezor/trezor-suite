import { useState, ChangeEvent, MouseEventHandler } from 'react';
import styled, { useTheme } from 'styled-components';
import { Translation, AccountLabeling, FormattedCryptoAmount } from 'src/components/suite';
import {
    Button,
    Icon,
    Input,
    P,
    SelectBar,
    Tooltip,
    Truncate,
    variables,
} from '@trezor/components';
import { useCoinmarketExchangeOffersContext } from 'src/hooks/wallet/useCoinmarketExchangeOffers';
import useDebounce from 'react-use/lib/useDebounce';
import BigNumber from 'bignumber.js';
import { FieldError } from 'react-hook-form';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Value = styled.div`
    padding-top: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const PaddedValue = styled(Value)`
    padding-right: 15px;
`;

const BreakableValue = styled(Value)`
    word-break: break-all;
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 20px 0;
`;

const Row = styled.div`
    margin: 10px 24px;
`;

const Address = styled.div``;

const Columns = styled.div`
    display: flex;
    flex-direction: row;
`;

const PaddedColumns = styled(Columns)`
    padding-top: 6px;
`;

const LeftColumn = styled.div`
    display: flex;
    flex: 1;
`;

const RightColumn = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 2;
`;

const Slippage = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SlippageAmount = styled(Slippage)`
    padding-right: 15px;
`;

const SlippageSettingsRow = styled.div`
    margin: 0 24px;
    min-height: 65px;
`;

const SlippageSettingsButton = styled.button`
    background: none;
    border: 0;
    margin: 0 3px 0 15px;
    cursor: pointer;
    display: inline-block;
    width: 25px;
    height: auto;
    position: relative;
    line-height: 1;
`;

const StyledInput = styled(Input)`
    input {
        display: flex;
        flex: 1;
        max-width: 70px;
    }
`;

const slippageOptions = [
    {
        label: '0.1%',
        value: '0.1',
    },
    {
        label: '0.5%',
        value: '0.5',
    },
    {
        label: '1%',
        value: '1',
    },
    {
        label: '3%',
        value: '3',
    },
    {
        label: <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_CUSTOM" />,
        value: 'CUSTOM',
    },
];

const slippageMin = '0.01';
const slippageMax = '50';

export function formatCryptoAmountAsAmount(
    amount: number,
    baseAmount: number,
    decimals = 8,
): string {
    let digits = 4;
    if (baseAmount < 1) {
        digits = 6;
    }
    if (baseAmount < 0.01) {
        digits = decimals;
    }
    return amount.toFixed(digits);
}

const SendSwapTransactionComponent = () => {
    const theme = useTheme();
    const { account, callInProgress, selectedQuote, exchangeInfo, confirmTrade, sendTransaction } =
        useCoinmarketExchangeOffersContext();
    const [slippageSettings, setSlippageSettings] = useState(false);
    const [slippage, setSlippage] = useState(selectedQuote?.swapSlippage || '1');
    const [customSlippage, setCustomSlippage] = useState(slippage);
    const [customSlippageError, setCustomSlippageError] = useState<FieldError | undefined>();
    useDebounce(
        () => {
            if (
                selectedQuote &&
                selectedQuote?.dexTx &&
                !customSlippageError &&
                customSlippage !== selectedQuote.swapSlippage
            ) {
                selectedQuote.swapSlippage = customSlippage;
                selectedQuote.approvalType = undefined;
                confirmTrade(selectedQuote.dexTx.from);
            }
        },
        500,
        [customSlippage, slippage],
    );

    if (!selectedQuote) return null;

    const { exchange, dexTx, receive, receiveStringAmount } = selectedQuote;
    if (!exchange || !dexTx) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: selectedQuote.send,
        provider: providerName,
    };

    const toggleSlippage: MouseEventHandler<HTMLButtonElement> = e => {
        e.preventDefault();
        setSlippageSettings(!slippageSettings);
    };

    const selectedSlippage = slippageOptions.find(o => o.value === slippage)?.value || 'CUSTOM';

    const changeSlippage = (value: string) => {
        setSlippage(value);
        if (value !== 'CUSTOM') {
            setCustomSlippage(value);
            selectedQuote.swapSlippage = value;
            selectedQuote.approvalType = undefined;
            confirmTrade(dexTx.from);
        }
    };

    const changeCustomSlippage = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setCustomSlippage(value);
        if (!value) {
            setCustomSlippageError({
                type: 'error',
                message: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_SET',
            });
            return;
        }
        const slippage = new BigNumber(value);
        if (slippage.isNaN() || value.startsWith('.') || value.endsWith('.')) {
            setCustomSlippageError({
                type: 'error',
                message: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_NUMBER',
            });
        } else if (slippage.lt(slippageMin) || slippage.gt(slippageMax)) {
            setCustomSlippageError({
                type: 'error',
                message: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_IN_RANGE',
            });
        } else {
            setCustomSlippageError(undefined);
        }
    };

    return (
        <Wrapper>
            <Row>
                <LabelText>
                    <Translation id="TR_EXCHANGE_SEND_FROM" />
                </LabelText>
                <Value>
                    <AccountLabeling account={account} />
                </Value>
            </Row>
            <Row>
                <LabelText>
                    <Translation id="TR_EXCHANGE_SWAP_SEND_TO" values={translationValues} />
                </LabelText>
                <Value>
                    <Address>{dexTx.to}</Address>
                </Value>
            </Row>
            <Row>
                <LabelText>
                    <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE" />
                </LabelText>
                <PaddedColumns>
                    <LeftColumn>
                        <Slippage>
                            <Tooltip
                                content={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_INFO" />}
                                dashed
                            >
                                <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_TOLERANCE" />
                            </Tooltip>
                        </Slippage>
                    </LeftColumn>
                    <RightColumn>
                        <SlippageAmount>{selectedQuote.swapSlippage}%</SlippageAmount>
                        <SlippageSettingsButton type="button" onClick={toggleSlippage}>
                            <Icon
                                icon={slippageSettings ? 'ARROW_UP' : 'ARROW_DOWN'}
                                color={theme.TYPE_DARK_GREY}
                                size={14}
                            />
                        </SlippageSettingsButton>
                    </RightColumn>
                </PaddedColumns>
            </Row>
            {slippageSettings && (
                <SlippageSettingsRow>
                    <PaddedColumns>
                        <LeftColumn>
                            <SelectBar
                                selectedOption={selectedSlippage}
                                options={slippageOptions}
                                onChange={changeSlippage}
                            />
                        </LeftColumn>
                        {slippage === 'CUSTOM' && (
                            <RightColumn>
                                <StyledInput
                                    value={customSlippage}
                                    size="small"
                                    inputState={customSlippageError ? 'error' : 'success'}
                                    name="CustomSlippage"
                                    data-test="CustomSlippage"
                                    onChange={changeCustomSlippage}
                                    bottomText={customSlippageError?.message || null}
                                />
                            </RightColumn>
                        )}
                    </PaddedColumns>
                </SlippageSettingsRow>
            )}
            <Row>
                <LabelText>
                    <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_SUMMARY" />
                </LabelText>
                <PaddedValue>
                    <Columns>
                        <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_OFFERED" />
                        <RightColumn>
                            <FormattedCryptoAmount value={receiveStringAmount} symbol={receive} />
                        </RightColumn>
                    </Columns>
                </PaddedValue>
                <PaddedValue>
                    <Columns>
                        <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT" />
                        <RightColumn>
                            -
                            {formatCryptoAmountAsAmount(
                                (Number(selectedQuote.swapSlippage) / 100) *
                                    Number(receiveStringAmount),
                                Number(receiveStringAmount),
                            )}{' '}
                            {receive}
                        </RightColumn>
                    </Columns>
                </PaddedValue>
                <PaddedValue>
                    <Columns>
                        <LeftColumn>
                            <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM" />
                        </LeftColumn>
                        <RightColumn>
                            {formatCryptoAmountAsAmount(
                                ((100 - Number(selectedQuote.swapSlippage)) / 100) *
                                    Number(receiveStringAmount),
                                Number(receiveStringAmount),
                            )}{' '}
                            {receive}
                        </RightColumn>
                    </Columns>
                </PaddedValue>
            </Row>
            <Row>
                <LabelText>
                    <Translation id="TR_EXCHANGE_SWAP_DATA" />
                </LabelText>
                <BreakableValue>
                    <P size="small">
                        <Truncate>{dexTx.data}</Truncate>
                    </P>
                </BreakableValue>
            </Row>
            <ButtonWrapper>
                <Button
                    isLoading={callInProgress}
                    isDisabled={callInProgress}
                    onClick={sendTransaction}
                >
                    <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                </Button>
            </ButtonWrapper>
        </Wrapper>
    );
};

export default SendSwapTransactionComponent;
