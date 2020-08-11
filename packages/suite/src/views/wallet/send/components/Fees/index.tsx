import React from 'react';
import styled from 'styled-components';
import { SelectBar, colors, variables } from '@trezor/components';
import { Card, Translation, FiatValue } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import EstimatedMiningTime from '../EstimatedMiningTime';
import { buildFeeOptions, getFeeUnits } from '@wallet-utils/sendFormUtils';
import CustomFee from './components/CustomFee';
import { useSendFormContext } from '@wallet-hooks';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 25px;
    padding: 0;
`;

const Top = styled.div`
    display: flex;
    margin: 32px 42px;
    flex-direction: row;
    justify-items: space-between;
`;

const Left = styled.div`
    display: flex;
    align-items: flex-start;
    flex-direction: column;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Middle = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
`;

const RightContent = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
    flex-direction: column;
    align-items: flex-end;
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

const Label = styled.div`
    text-transform: uppercase;
    padding-left: 4px;
`;

const FeeInfo = styled.div`
    display: flex;
    margin-top: 15px;
    padding-left: 47px;
`;

const FeeUnits = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const EstimatedMiningTimeWrapper = styled.div`
    padding-right: 4px;
`;

export default () => {
    const {
        feeInfo,
        changeFeeLevel,
        account: { symbol, networkType },
        getValues,
        composedLevels,
    } = useSendFormContext();

    const selectedLabel = getValues('selectedFee') || 'normal';
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedLabel)!;
    const transactionInfo = composedLevels ? composedLevels[selectedLabel] : undefined;
    const isCustomLevel = selectedLabel === 'custom';

    return (
        <StyledCard>
            <Top>
                <Left>
                    <SelectBar
                        label={<Translation id="TR_FEE" />}
                        selectedOption={selectedLabel}
                        options={buildFeeOptions(feeInfo.levels)}
                        onChange={value => changeFeeLevel(selectedLevel, value)}
                    />
                    <FeeInfo>
                        {networkType === 'bitcoin' && !isCustomLevel && (
                            <EstimatedMiningTimeWrapper>
                                <EstimatedMiningTime
                                    seconds={feeInfo.blockTime * selectedLevel.blocks * 60}
                                />
                            </EstimatedMiningTimeWrapper>
                        )}
                        {!isCustomLevel && (
                            <FeeUnits>
                                {selectedLevel.feePerUnit} {getFeeUnits(networkType)}
                            </FeeUnits>
                        )}
                    </FeeInfo>
                </Left>
                <Middle>{selectedLabel === 'custom' && <CustomFee />}</Middle>
                <Right>
                    {transactionInfo && transactionInfo.type !== 'error' && (
                        <RightContent>
                            <CoinAmount>
                                {formatNetworkAmount(transactionInfo.fee, symbol)}
                                <Label>{symbol}</Label>
                            </CoinAmount>
                            <FiatAmount>
                                <FiatValue
                                    amount={formatNetworkAmount(transactionInfo.fee, symbol)}
                                    symbol={symbol}
                                />
                            </FiatAmount>
                        </RightContent>
                    )}
                </Right>
            </Top>
        </StyledCard>
    );
};
