import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { colors, P, Select, Icon, variables } from '@trezor/components-v2';
import { Account } from '@wallet-types';
import { FeeLevel } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import Badge from '@suite-components/Badge';
// @ts-ignore
import ethUnits from 'ethereumjs-units';
import CustomFee from './components/CustomFee';
import { calculateEthFee } from '@wallet-utils/sendFormUtils';
import { Props as DispatchProps } from '../../../../Container';

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

const LabelColumn = styled(Column)`
    color: ${colors.BLACK0};
`;

const RefreshColumn = styled(Column)`
    color: ${colors.BLACK0};
    justify-content: center;
`;

const RefreshText = styled.div`
    padding-left: 5px;
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const HelpColumn = styled(Column)`
    color: ${colors.BLACK0};
    justify-content: flex-end;
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

interface Props extends WrappedComponentProps {
    feeLevels: FeeLevel[];
    selectedFee: FeeLevel;
    customFee: string;
    maxFee: number;
    minFee: number;
    localCurrency: string;
    symbol: Account['symbol'];
    networkType: Account['networkType'];
    sendFormActions: DispatchProps['sendFormActions'];
}

const capitalize = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

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

const FeeComponent = (props: Props) => (
    <Wrapper>
        <Row>
            <Top>
                <LabelColumn>
                    <Translation {...messages.TR_FEE} />
                </LabelColumn>
                <RefreshColumn>
                    <StyledIcon icon="REFRESH" color={colors.BLACK50} size={10} />
                    <RefreshText>Refresh</RefreshText>
                </RefreshColumn>
                <HelpColumn>
                    <StyledIcon icon="QUESTION" color={colors.BLACK50} size={12} />
                </HelpColumn>
            </Top>
            <StyledSelect
                display="block"
                isSearchable={false}
                isClearable={false}
                value={props.selectedFee}
                onChange={props.sendFormActions.handleFeeValueChange}
                options={props.feeLevels}
                formatOptionLabel={(option: FeeLevel) => (
                    <OptionWrapper>
                        <OptionLabel>{capitalize(option.label)}</OptionLabel>
                        {option.value !== '0' && (
                            <OptionValue>
                                {getValue(props.networkType, option, props.symbol)}
                            </OptionValue>
                        )}
                    </OptionWrapper>
                )}
            />
        </Row>
        {props.networkType !== 'ethereum' && props.customFee && (
            <CustomFeeRow>
                <CustomFeeWrapper>
                    <CustomFee
                        sendFormActions={props.sendFormActions}
                        customFee={props.customFee}
                        selectedFee={props.selectedFee}
                        symbol={props.symbol}
                        networkType={props.networkType}
                    />
                </CustomFeeWrapper>
                <BadgeWrapper>
                    <Badge>
                        {toFiatCurrency(
                            formatNetworkAmount(props.customFee, props.symbol),
                            props.localCurrency,
                            props.fiat.find(item => item.symbol === props.symbol),
                        )}
                        {props.localCurrency}
                    </Badge>
                </BadgeWrapper>
            </CustomFeeRow>
        )}
    </Wrapper>
);

export default injectIntl(FeeComponent);
