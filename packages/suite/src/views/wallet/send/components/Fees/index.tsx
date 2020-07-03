import React from 'react';
import styled from 'styled-components';
import { SelectBar, colors, variables } from '@trezor/components';
import { Card, Translation, FiatValue } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import EstimatedMiningTime from '../EstimatedMiningTime';
import { buildFeeOptions, getFeeUnits } from '@wallet-utils/sendFormUtils';
import { FeeLevel } from 'trezor-connect';
import CustomFee from './components/CustomFee';
import { useSendFormContext } from '@wallet-hooks';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 25px;
`;

const Top = styled.div`
    display: flex;
    flex-direction: row;
    justify-items: space-between;
`;

const Left = styled.div`
    display: flex;
    align-items: flex-start;
    flex-direction: column;
`;

const Right = styled.div``;
const Middle = styled.div``;

const RightContent = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
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
        feeInfo: { levels },
        feeInfo,
        account: { symbol, networkType },
        selectedFee,
        updateContext,
        setValue,
        transactionInfo,
    } = useSendFormContext();

    return (
        <StyledCard>
            <Top>
                <Left>
                    <SelectBar
                        label={<Translation id="TR_FEE" />}
                        selectedOption={selectedFee.label}
                        options={buildFeeOptions(levels)}
                        onChange={(value: FeeLevel['label']) => {
                            const selectedFeeForUpdate = levels.find(
                                level => level.label === value,
                            );
                            if (selectedFeeForUpdate) {
                                if (selectedFeeForUpdate.label === 'custom') {
                                    const { feePerUnit } = selectedFee;
                                    selectedFeeForUpdate.feePerUnit = feePerUnit;
                                    setValue('customFee', feePerUnit);
                                }
                                updateContext({ selectedFee: selectedFeeForUpdate });
                            }
                        }}
                    />
                    <FeeInfo>
                        {networkType === 'bitcoin' && selectedFee.label !== 'custom' && (
                            <EstimatedMiningTimeWrapper>
                                <EstimatedMiningTime
                                    seconds={feeInfo.blockTime * selectedFee.blocks * 60}
                                />
                            </EstimatedMiningTimeWrapper>
                        )}
                        {networkType !== 'ethereum' && (
                            <FeeUnits>
                                {selectedFee.feePerUnit} {getFeeUnits(networkType).label}
                            </FeeUnits>
                        )}
                    </FeeInfo>
                </Left>
                <Middle>
                    <CustomFee isVisible={selectedFee.label === 'custom'} />
                </Middle>
                <Right>
                    {transactionInfo && (
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
