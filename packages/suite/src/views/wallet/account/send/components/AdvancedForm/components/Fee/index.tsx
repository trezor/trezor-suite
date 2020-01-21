import Badge from '@suite-components/Badge';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { colors, Icon, P, Select, variables } from '@trezor/components-v2';
import { Account } from '@wallet-types';
import { FeeLevel } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { capitalizeFirstLetter } from '@suite-utils/string';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { calculateEthFee, hasRates } from '@wallet-utils/sendFormUtils';
// @ts-ignore
import ethUnits from 'ethereumjs-units';
import React from 'react';
import styled from 'styled-components';

import CustomFee from './components/CustomFee';
import { Props } from './Container';

const Row = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    display: flex;
    padding-left: 5px;
    height: 100%;
`;

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Top = styled.div`
    padding: 0 0 10px 0;
    display: flex;
    width: 100%;
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
`;

const Label = styled(Column)`
    color: ${colors.BLACK0};
`;

const Refresh = styled(Column)`
    color: ${colors.BLACK0};
    justify-content: center;
`;

const Help = styled(Column)`
    color: ${colors.BLACK0};
    justify-content: flex-end;
`;

const RefreshText = styled.div`
    padding-left: 5px;
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const OptionWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const OptionValue = styled(P)`
    min-width: 70px;
    margin-right: 5px;
`;

const OptionLabel = styled(P)`
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
    word-break: break-all;
`;

const StyledSelect = styled(Select)``;

const CustomFeeRow = styled(Row)`
    flex-direction: row;
    margin-top: 10px;
    justify-content: space-between;
    align-items: center;
`;

const CustomFeeWrapper = styled.div``;
const BadgeWrapper = styled.div`
    display: flex;
`;

const getValue = (
    networkType: Account['networkType'],
    option: FeeLevel,
    symbol: Account['symbol'],
) => {
    if (networkType === 'bitcoin') {
        return `${option.value} sat/B`;
    }

    if (networkType === 'ethereum') {
        const fee = calculateEthFee(option.feePerUnit, option.feeLimit || '0');
        return `${ethUnits.convert(fee, 'gwei', 'eth')} ${symbol.toUpperCase()}`;
    }

    return `${formatNetworkAmount(option.value, symbol)} ${symbol.toUpperCase()}`;
};

const FeeComponent = ({ sendFormActions, send, account, settings, fiat }: Props) => {
    if (!send || !account || !settings || !fiat) return null;
    const { selectedFee, customFee, feeInfo } = send;
    const feeLevels = feeInfo.levels;
    const { localCurrency } = settings;
    const { networkType, symbol } = account;
    const fiatVal = fiat.find(fiatItem => fiatItem.symbol === symbol);

    return (
        <Wrapper>
            <Row>
                <Top>
                    <Label>
                        <Translation {...messages.TR_FEE} />
                    </Label>
                    <Refresh>
                        <StyledIcon icon="REFRESH" color={colors.BLACK50} size={10} />
                        <RefreshText>Refresh</RefreshText>
                    </Refresh>
                    <Help>
                        <StyledIcon icon="QUESTION" color={colors.BLACK50} size={12} />
                    </Help>
                </Top>
                <StyledSelect
                    display="block"
                    value={selectedFee}
                    onChange={sendFormActions.handleFeeValueChange}
                    options={feeLevels}
                    formatOptionLabel={(option: FeeLevel) => (
                        <OptionWrapper>
                            <OptionLabel>{capitalizeFirstLetter(option.label)}</OptionLabel>
                            {option.value !== '0' && (
                                <OptionValue>{getValue(networkType, option, symbol)}</OptionValue>
                            )}
                        </OptionWrapper>
                    )}
                />
            </Row>
            {networkType !== 'ethereum' && customFee.value && (
                <CustomFeeRow>
                    <CustomFeeWrapper>
                        <CustomFee
                            sendFormActions={sendFormActions}
                            customFee={customFee.value}
                            selectedFee={selectedFee}
                            symbol={symbol}
                            networkType={networkType}
                        />
                    </CustomFeeWrapper>
                    {fiatVal && (
                        <BadgeWrapper>
                            <Badge>
                                {toFiatCurrency(
                                    formatNetworkAmount(customFee.value, symbol),
                                    localCurrency,
                                    fiatVal,
                                )}
                                {localCurrency}
                            </Badge>
                        </BadgeWrapper>
                    )}
                    }
                </CustomFeeRow>
            )}
        </Wrapper>
    );
};

export default FeeComponent;
