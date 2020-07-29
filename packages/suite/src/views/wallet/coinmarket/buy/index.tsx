import React from 'react';
import styled from 'styled-components';
import validator from 'validator';
import BigNumber from 'bignumber.js';

import { CoinmarketLayout, ProvidedByInvity } from '@wallet-components';
import { useForm } from 'react-hook-form';
import { useBuyInfo } from '@wallet-hooks/useCoinmarket';
import * as coinmarketActions from '@wallet-actions/coinmarketActions';
import { useActions } from '@suite-hooks';
import { Button, Select, Icon, Input, colors, H2 } from '@trezor/components';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 25px;
    flex: 1;
`;

const Top = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
`;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Middle = styled.div`
    min-width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Label = styled.div``;

const StyledButton = styled(Button)`
    min-width: 200px;
`;

const Controls = styled.div`
    display: flex;
    margin: 25px 0;
    padding: 0 0 20px 0;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Control = styled.div`
    cursor: pointer;
    padding: 0 10px 0 0;
`;

const BottomContent = styled.div``;

const InvityFooter = styled.div`
    display: flex;
    margin: 20px 0;
    padding: 0 0 20px 0;
    justify-content: flex-end;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const PreviousTransactions = styled.div``;

const addValue = (currentValue = '0', addValue: string) => {
    const result = new BigNumber(currentValue.length > 1 ? currentValue : '0')
        .plus(addValue)
        .toFixed();

    return result;
};

const CoinmarketBuy = () => {
    const { register, getValues, setValue, errors } = useForm({ mode: 'onChange' });
    const fiatInput = 'fiatInput';
    const currencySelect = 'currencySelect';
    const countrySelect = 'countrySelect';

    const { buyInfo } = useBuyInfo();
    const { saveOffers, saveBuyInfo } = useActions({
        saveOffers: coinmarketActions.saveOffers,
        saveBuyInfo: coinmarketActions.saveBuyInfo,
    });

    console.log('errors', errors);
    console.log('buyInfo', buyInfo);
    console.log('errors.fiatInputName', errors[fiatInput]);

    return (
        <CoinmarketLayout
            bottom={
                <BottomContent>
                    <InvityFooter>
                        <ProvidedByInvity />
                    </InvityFooter>
                    <PreviousTransactions>
                        <H2>Previous Transactions</H2>
                    </PreviousTransactions>
                </BottomContent>
            }
        >
            <Content>
                <Top>
                    <Left>
                        <Input
                            innerRef={register({
                                validate: value => {
                                    if (!value) {
                                        return 'TR_ERROR_EMPTY';
                                    }

                                    if (!validator.isNumeric(value)) {
                                        return 'TR_ERROR_NOT_NUMBER';
                                    }
                                },
                            })}
                            state={errors[fiatInput] ? 'error' : undefined}
                            name={fiatInput}
                            bottomText={errors[fiatInput] && errors[fiatInput].message}
                        />
                    </Left>
                    <Middle>
                        <Icon size={20} icon="RBF" />
                    </Middle>
                    <Right>
                        <Input />
                    </Right>
                </Top>
                <Controls>
                    <Control
                        onClick={() => {
                            setValue(fiatInput, addValue(getValues(fiatInput), '100'), {
                                shouldValidate: true,
                            });
                        }}
                    >
                        +100
                    </Control>
                    <Control
                        onClick={() => {
                            setValue(fiatInput, addValue(getValues(fiatInput), '1000'), {
                                shouldValidate: true,
                            });
                        }}
                    >
                        +1000
                    </Control>
                </Controls>
                <Footer>
                    <Left>
                        <Label>Offers from:</Label>
                        <Select />
                    </Left>
                    <Right>
                        <StyledButton
                            onClick={async () => {
                                await saveBuyInfo({
                                    country: getValues('countrySelect'),
                                    currency: getValues('currencySelect'),
                                    amount: getValues('fiatInput'),
                                });
                                await saveOffers({ test: 'testOffer' });
                            }}
                        >
                            Show offers
                        </StyledButton>
                    </Right>
                </Footer>
            </Content>
        </CoinmarketLayout>
    );
};

export default CoinmarketBuy;
