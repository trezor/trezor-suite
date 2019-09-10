import React from 'react';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import { Input, variables, colors, Icon, Button, Select } from '@trezor/components';
import messages from './index.messages';
import { FIAT } from '@suite-config';

const Wrapper = styled.div`
    display: flex;

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

const AmountLabelWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const AmountLabel = styled.span`
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

const LocalAmountWrapper = styled.div`
    display: flex;
    align-self: flex-end;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 0 100%;
        justify-content: flex-end;
        padding-top: 28px;
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
                <AmountLabelWrapper>
                    <AmountLabel>
                        <FormattedMessage {...messages.TR_AMOUNT} />
                    </AmountLabel>
                    {true && (
                        <AmountLabel>
                            {/* <FormattedMessage
                                {...accountMessages.TR_XRP_RESERVE}
                                values={{ value: '`${accountReserve} ${network.symbol}`' }}
                            /> */}
                        </AmountLabel>
                    )}
                </AmountLabelWrapper>
            }
            value={''}
            onChange={() => {}}
            bottomText=""
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
                state={undefined}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={''}
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
