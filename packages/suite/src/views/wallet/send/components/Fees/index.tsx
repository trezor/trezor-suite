import React from 'react';
import styled from 'styled-components';
import { FeeLevel } from 'trezor-connect';
import { SelectBar, colors, variables } from '@trezor/components';
import { Card, Translation, FiatValue, FormattedCryptoAmount } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getFeeUnits } from '@wallet-utils/sendFormUtils';
import EstimatedMiningTime from './components/EstimatedMiningTime';
import CustomFee from './components/CustomFee';
import { useSendFormContext } from '@wallet-hooks';

const StyledCard = styled(Card)`
    display: flex;
    justify-items: space-between;
    margin-bottom: 25px;
    padding: 32px 42px;

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
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const CoinAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const FiatAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const FeeInfo = styled.div`
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
`;

const FeeUnits = styled.span`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
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
        feeInfo,
        changeFeeLevel,
        account: { symbol, networkType },
        getDefaultValue,
        composedLevels,
        composeTransaction,
    } = useSendFormContext();

    const selectedLabel = getDefaultValue('selectedFee') || 'normal';
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedLabel)!;
    const transactionInfo = composedLevels ? composedLevels[selectedLabel] : undefined;
    const isCustomLevel = selectedLabel === 'custom';

    return (
        <StyledCard>
            <Label>
                <Translation id="FEE" />
            </Label>
            <Col>
                <Row>
                    <SelectBar
                        selectedOption={selectedLabel}
                        options={buildFeeOptions(feeInfo.levels)}
                        onChange={value => {
                            // changeFeeLevel will decide if composeTransaction in needed or not
                            const shouldCompose = changeFeeLevel(
                                selectedLevel,
                                feeInfo.levels.find(level => level.label === value)!,
                            );
                            if (shouldCompose) composeTransaction('output[0].amount');
                        }}
                    />
                </Row>
                <Row>
                    <FeeInfo>
                        {isCustomLevel && <CustomFee />}
                        {networkType === 'bitcoin' && !isCustomLevel && (
                            <EstimatedMiningTimeWrapper>
                                <EstimatedMiningTime
                                    seconds={feeInfo.blockTime * selectedLevel.blocks * 60}
                                />
                            </EstimatedMiningTimeWrapper>
                        )}
                        {/* {!isCustomLevel && ( */}
                        <FeeUnits>
                            {!isCustomLevel
                                ? `${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`
                                : ' '}
                        </FeeUnits>
                        {/* )} */}
                        {networkType === 'bitcoin' &&
                            !isCustomLevel &&
                            transactionInfo &&
                            transactionInfo.type !== 'error' && (
                                <TxSize>({transactionInfo.bytes} B)</TxSize>
                            )}
                    </FeeInfo>
                    {transactionInfo && transactionInfo.type !== 'error' && (
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
