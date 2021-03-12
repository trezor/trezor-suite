import React from 'react';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { variables, CoinLogo, Input, Button } from '@trezor/components';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@suite-hooks/useTranslation';
import { isUrl } from '@suite-utils/validators';
import InputError from '@wallet-components/InputError';
import { BlockbookUrl } from '@wallet-types/blockbook';

const CustomBackendWrapper = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 3fr 0.5fr;
    grid-template-rows: 1fr;
    gap: 9px 18px;
    padding: 9px 0 0 0;
    margin: 0 0 12px 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const InputLine = styled.div`
    display: flex;
    & > * + * {
        margin-left: 7px;
    }
`;

const InputLineShort = styled(InputLine)`
    margin-bottom: -18px; /* override Input's placeholder whitespace */
`;

const Coin = styled.div`
    display: flex;
    justify-items: flex-start;
    position: relative;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-top: 11px;
`;

const StyledCoinLogo = styled(CoinLogo)`
    display: flex;
    justify-items: flex-start;
    margin: 0 15px 0 0;
    position: relative;
`;

const CoinName = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    margin-top: 1px;
`;

const ButtonAdd = styled(Button)`
    height: 48px;
    & > * {
        width: 14px;
    }
`;

const ButtonRemove = styled(Button)`
    height: 48px;
    padding: 9px 12px;
    & > * {
        width: 14px;
    }
`;

const Inputs = styled.div`
    display: flex;
    flex-direction: column;
`;

interface Props {
    network: Network;
    blockbookUrls: BlockbookUrl[];
    addBlockbookUrl: (params: BlockbookUrl) => void;
    removeBlockbookUrl: (params: BlockbookUrl) => void;
}

type FormInputs = {
    url: string;
};

const CustomBackend = ({ network, blockbookUrls, addBlockbookUrl, removeBlockbookUrl }: Props) => {
    const { register, getValues, setValue, watch, errors } = useForm<FormInputs>({
        mode: 'onChange',
    });
    const { translationString } = useTranslation();
    const coin = network.symbol;

    const inputName = 'url';
    const inputValue = getValues(inputName) || '';
    const error = errors[inputName];

    const addUrl = () => {
        addBlockbookUrl({
            coin,
            url: inputValue,
        });

        setValue(inputName, '');
    };

    const urls = blockbookUrls.filter(b => b.coin === coin);
    const watchAll = watch();

    return (
        <CustomBackendWrapper>
            <Coin>
                <StyledCoinLogo size={24} symbol={coin} />
                <CoinName>{network.name}</CoinName>
            </Coin>
            <Inputs>
                {urls.map(b => (
                    <InputLineShort key={b.url}>
                        <Input type="text" noTopLabel name={b.url} value={b.url} isDisabled />
                        <ButtonRemove
                            variant="tertiary"
                            icon="CROSS"
                            onClick={() => removeBlockbookUrl(b)}
                        />
                    </InputLineShort>
                ))}
                <InputLine>
                    <Input
                        type="text"
                        noTopLabel
                        name={inputName}
                        data-test={inputName}
                        placeholder={translationString('SETTINGS_ADV_COIN_URL_INPUT_PLACEHOLDER', {
                            url: `https://${coin}1.trezor.io/`,
                        })}
                        innerRef={register({
                            validate: (value: string) => {
                                // Check if URL is valid
                                if (!isUrl(value)) {
                                    return 'TR_CUSTOM_BACKEND_INVALID_URL';
                                }
                                // Check if already exists
                                if (blockbookUrls.find(b => b.coin === coin && b.url === value)) {
                                    return 'TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED';
                                }
                            },
                        })}
                        state={error ? 'error' : undefined}
                        bottomText={<InputError error={error} />}
                    />
                    {watchAll && (
                        <ButtonAdd
                            variant="secondary"
                            icon="PLUS"
                            onClick={addUrl}
                            isDisabled={Boolean(error) || inputValue === ''}
                        />
                    )}
                </InputLine>
            </Inputs>
        </CustomBackendWrapper>
    );
};

export default CustomBackend;
