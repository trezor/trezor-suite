import React from 'react';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import { Input, variables, colors, Icon, Button, Select } from '@trezor/components';
import accountMessages from '@wallet-views/account/messages';
import messages from './index.messages';
import { FIAT } from '@suite-config';

const Wrapper = styled.div`
    display: flex;
    align-items: flex-end;
    padding-bottom: 28px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-wrap: wrap;
    }
`;

const LocalCurrencySelect = styled(Select)`
    min-width: 77px;
    height: 40px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 0;
    }
`;

const AmountInputLabelWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const AmountInputLabel = styled.span`
    text-align: right;
    color: ${colors.TEXT_SECONDARY};
`;

const LocalAmountInput = styled(Input)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 100%;
    }
`;

const EqualsSign = styled.div`
    align-self: center;
    padding: 0 10px;
    font-size: ${variables.FONT_SIZE.BIGGER};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const StyledIcon = styled(Icon)`
    margin-right: 6px;
`;

const LocalAmountWrapper = styled.div`
    display: flex;
    align-self: flex-start;
    margin-top: 26px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 0 100%;
        justify-content: flex-end;
        margin-top: 0px;
        padding-top: 28px;
    }
`;

const AmountRow = styled.div`
    display: flex;
    align-items: flex-end;
    padding-bottom: 28px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-wrap: wrap;
    }
`;

const SetMaxAmountButton = styled(Button)`
    padding: 0 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    transition: all 0s;
    border-radius: 0;
    border-right: 0;
    border-left: 0;
`;

const CurrencySelect = styled(Select)`
    min-width: 77px;
    height: 40px;
    flex: 0.2;
`;

interface Props {
    intl: InjectedIntl;
}

const Amount = (props: Props) => (
    <Wrapper>
        <Input
            state={undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            topLabel={
                <AmountInputLabelWrapper>
                    <AmountInputLabel>
                        {/* <FormattedMessage {...messages.TR_AMOUNT} /> */}
                    </AmountInputLabel>
                    {true && (
                        <AmountInputLabel>
                            {/* <FormattedMessage
                                {...accountMessages.TR_XRP_RESERVE}
                                values={{ value: '`${accountReserve} ${network.symbol}`' }}
                            /> */}
                        </AmountInputLabel>
                    )}
                </AmountInputLabelWrapper>
            }
            value={23}
            onChange={() => {}}
            bottomText="bottom text"
            sideAddons={[
                <SetMaxAmountButton key="icon" onClick={() => {}} isWhite={false}>
                    {/* {!setMax && (
                        <StyledIcon icon={ICONS.TOP} size={14} color={colors.TEXT_SECONDARY} />
                    )}
                    {setMax && <StyledIcon icon={ICONS.SUCCESS} size={14} color={colors.WHITE} />} */}
                    <FormattedMessage {...messages.TR_SET_MAX} />
                </SetMaxAmountButton>,
                <CurrencySelect
                    key="currency"
                    isSearchable={false}
                    isClearable={false}
                    value={'value'}
                    isDisabled
                    options={'tokensSelectData'}
                />,
            ]}
        />
        <LocalAmountWrapper>
            <EqualsSign>=</EqualsSign>
            <LocalAmountInput
                state={'success'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={1231}
                onChange={() => {}}
                sideAddons={[
                    <LocalCurrencySelect
                        key="local-currency"
                        isSearchable
                        isClearable={false}
                        onChange={() => {}}
                        value={'111'}
                        options={FIAT.currencies.map(() => {})}
                    />,
                ]}
            />
        </LocalAmountWrapper>
    </Wrapper>
);

export default injectIntl(Amount);
