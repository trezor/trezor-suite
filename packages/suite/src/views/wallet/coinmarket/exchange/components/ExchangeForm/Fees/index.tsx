import React from 'react';
import styled from 'styled-components';
import { FeeLevel } from 'trezor-connect';
import { SelectBar, variables } from '@trezor/components';
import { Translation, FiatValue, FormattedCryptoAmount } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getFeeUnits } from '@wallet-utils/sendFormUtils';
import EstimatedMiningTime from '@wallet-components/EstimatedMiningTime';
import CustomFee from './components/CustomFee';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';

const StyledCard = styled.div`
    display: flex;
    justify-items: space-between;
    margin: 25px 0;

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Label = styled.div`
    display: flex;
    padding-right: 20px;
    padding-top: 4px;
    padding-bottom: 10px;

    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const CoinAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const FiatAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const FeeInfo = styled.div`
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
`;

const FeeUnits = styled.span`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TxSize = styled(FeeUnits)`
    padding-left: 4px;
`;

const EstimatedMiningTimeWrapper = styled.span`
    padding-right: 4px;
`;

const Row = styled.div`
    display: flex;

    & + & {
        margin-top: 15px;
    }
`;
const Col = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const FeeAmount = styled.div`
    display: flex;
    flex: 1 0 auto;
    justify-content: flex-start;
    flex-direction: column;
    align-items: flex-end;
    margin-left: 12px;
`;

const CustomFeeWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

interface Option {
    label: string;
    value: string;
}

const buildFeeOptions = (levels: FeeLevel[]) => {
    const result: Option[] = [];
    levels.forEach(level => {
        const { label } = level;
        result.push({ label, value: label });
    });
    return result;
};

const Fees = () => {
    const {
        account: { symbol, networkType },
        feeInfo,
        selectedFee,
        selectFee,
        setValue,
        isMax,
        clearErrors,
        transactionInfo,
        compose,
    } = useCoinmarketExchangeFormContext();

    const selectedFeeLevel = feeInfo.levels.find(level => level.label === selectedFee);
    if (!selectedFeeLevel) return null;
    const isCustomLevel = selectedFee === 'custom';

    return (
        <StyledCard>
            <Label>
                <Translation id="FEE" />
            </Label>
            <Col>
                <Row>
                    <SelectBar
                        selectedOption={selectedFee}
                        options={buildFeeOptions(feeInfo.levels)}
                        onChange={async (value: any) => {
                            selectFee(value);
                            if (value === 'custom' && selectedFeeLevel.label !== 'custom') {
                                setValue('feePerUnit', selectedFeeLevel.feePerUnit);
                            } else {
                                clearErrors('feePerUnit');
                            }
                            await compose({
                                fillValue: isMax,
                                setMax: isMax,
                                feeLevelLabel: value,
                            });
                        }}
                    />
                    <CustomFeeWrapper>
                        <CustomFee isVisible={isCustomLevel} />
                    </CustomFeeWrapper>
                </Row>
                <Row>
                    <FeeInfo>
                        {networkType === 'bitcoin' && !isCustomLevel && (
                            <EstimatedMiningTimeWrapper>
                                <EstimatedMiningTime
                                    seconds={feeInfo.blockTime * selectedFeeLevel.blocks * 60}
                                />
                            </EstimatedMiningTimeWrapper>
                        )}
                        <FeeUnits>
                            {!isCustomLevel
                                ? `${selectedFeeLevel.feePerUnit} ${getFeeUnits(networkType)}`
                                : ' '}
                        </FeeUnits>
                        {networkType === 'bitcoin' &&
                            !isCustomLevel &&
                            transactionInfo &&
                            transactionInfo.type === 'final' && (
                                <TxSize>({transactionInfo.bytes} B)</TxSize>
                            )}
                    </FeeInfo>
                    {transactionInfo?.type === 'final' && (
                        <FeeAmount>
                            <CoinAmount>
                                <FormattedCryptoAmount
                                    value={formatNetworkAmount(transactionInfo.fee, symbol)}
                                    symbol={symbol}
                                />
                            </CoinAmount>
                            <FiatAmount>
                                <FiatValue
                                    amount={formatNetworkAmount(transactionInfo.fee, symbol)}
                                    symbol={symbol}
                                />
                            </FiatAmount>
                        </FeeAmount>
                    )}
                </Row>
            </Col>
        </StyledCard>
    );
};

export default Fees;
