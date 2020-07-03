import React from 'react';
import styled from 'styled-components';
import { SelectBar, colors, variables } from '@trezor/components';
import { Card, Translation, FiatValue } from '@suite-components';
import { FeeLevel } from 'trezor-connect';
import { useSendFormContext } from '@wallet-hooks';

const StyledCard = styled(Card)`
    display: flex;
    margin-bottom: 25px;
    flex-direction: row;
    justify-items: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
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

const buildFeeOptions = (levels: FeeLevel[]) => {
    interface Item {
        label: FeeLevel['label'];
        value: FeeLevel['label'];
    }
    const result: Item[] = [];

    levels.forEach(level => {
        const { label } = level;
        result.push({ label, value: label });
    });

    return result;
};

export default () => {
    const {
        feeInfo: { levels },
        account: { symbol },
        selectedFee,
    } = useSendFormContext();

    return (
        <StyledCard>
            <Left>
                <SelectBar
                    label={<Translation id="TR_FEE" />}
                    selectedOption={selectedFee.label}
                    options={buildFeeOptions(levels)}
                />
            </Left>
            <Right>
                <CoinAmount>
                    0.0000012 <Label>{symbol}</Label>
                </CoinAmount>
                <FiatAmount>
                    <FiatValue amount="0.0000012" symbol={symbol} />
                </FiatAmount>
            </Right>
        </StyledCard>
    );
};
