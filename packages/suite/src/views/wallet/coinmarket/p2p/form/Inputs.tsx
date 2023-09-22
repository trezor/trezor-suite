import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { fiatCurrencies } from '@suite-common/suite-config';
import { Translation, NumberInput } from 'src/components/suite';
import { MAX_LENGTH } from 'src/constants/suite/inputs';
import { getInputState } from '@suite-common/wallet-utils';
import { CoinLogo, Select } from '@trezor/components';
import { useCoinmarketP2pFormContext } from 'src/hooks/wallet/useCoinmarketP2pForm';
import { Wrapper } from 'src/views/wallet/coinmarket';
import { buildOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useTranslation } from 'src/hooks/suite';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';

const Left = styled.div`
    display: flex;
    flex: 0.827;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 22px;
`;

const TextLabel = styled.div`
    padding: 0 8px 0 12px;
`;

const CoinLabel = styled.div`
    padding-left: 4px;
`;

export const Inputs = () => {
    const {
        account,
        control,
        formState: { errors },
        defaultCurrency,
        p2pInfo,
        getValues,
    } = useCoinmarketP2pFormContext();

    const { translationString } = useTranslation();

    const fiatInput = 'fiatInput';
    const currencySelect = 'currencySelect';
    const fiatInputValue = getValues(fiatInput);

    const fiatInputRules = {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
        },
    };

    return (
        <Wrapper responsiveSize="LG">
            <Left>
                <NumberInput
                    control={control}
                    noTopLabel
                    rules={fiatInputRules}
                    inputState={getInputState(errors.fiatInput, fiatInputValue)}
                    name={fiatInput}
                    maxLength={MAX_LENGTH.AMOUNT}
                    bottomText={errors[fiatInput]?.message || null}
                    innerAddon={
                        <Controller
                            control={control}
                            name={currencySelect}
                            defaultValue={defaultCurrency}
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    options={Object.keys(fiatCurrencies)
                                        .filter(c => p2pInfo?.supportedCurrencies.has(c))
                                        .map((currency: string) => buildOption(currency))}
                                    isSearchable
                                    value={value}
                                    isClearable={false}
                                    minWidth="58px"
                                    isClean
                                    hideTextCursor
                                    onChange={(selected: any) => {
                                        onChange(selected);
                                    }}
                                />
                            )}
                        />
                    }
                    data-test="@coinmarket/p2p/fiat-input"
                />
            </Left>
            <Right>
                <TextLabel>
                    <Translation id="TR_P2P_WORTH_OF" />
                </TextLabel>
                <CoinLogo size={18} symbol={account.symbol} />
                <CoinLabel>{account.symbol.toUpperCase()}</CoinLabel>
            </Right>
        </Wrapper>
    );
};
