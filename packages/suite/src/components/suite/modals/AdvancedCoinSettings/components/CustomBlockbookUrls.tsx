import React from 'react';
import { useForm } from 'react-hook-form';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import { CoinInfo } from 'trezor-connect';
import { Input, Button, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { Network } from '@suite/types/wallet';
import { BlockbookUrl } from '@wallet-types/blockbook';
import { isUrl } from '@suite-utils/validators';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
`;

const AddButton = styled(Button)`
    align-self: flex-start;
    margin-top: 12px;
`;

const Heading = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: 500;
    line-height: 1.5;
    margin-bottom: 6px;
`;

const Description = styled.span`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    line-height: 1.57;
    /* margin-bottom: 14px; */
`;

const DefaultValues = styled(Description)`
    font-weight: 500;
    /* margin-top: 4px; */
    margin-bottom: 14px;
`;

interface Props extends WrappedComponentProps {
    coin: Network['symbol'];
    coinInfo: CoinInfo;
    blockbookUrls: BlockbookUrl[];
    addBlockbookUrl: (params: BlockbookUrl) => void;
    removeBlockbookUrl: (params: BlockbookUrl) => void;
}

type FormInputs = {
    url: string;
};

const CustomBlockbookUrls = ({
    coin,
    coinInfo,
    blockbookUrls,
    addBlockbookUrl,
    removeBlockbookUrl,
    ...props
}: Props) => {
    const { register, getValues, setValue, errors } = useForm<FormInputs>({
        mode: 'onChange',
    });

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

    return (
        <Wrapper>
            <Heading>
                <Translation id="SETTINGS_ADV_COIN_BLOCKBOOK_TITLE" />
            </Heading>
            <Description>
                <Translation id="SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION" />
            </Description>
            <DefaultValues>
                <Translation
                    id="TR_DEFAULT_VALUE"
                    values={{
                        value: coinInfo.blockchainLink
                            ? coinInfo.blockchainLink.url.join(', ')
                            : '',
                    }}
                />
            </DefaultValues>

            {urls.map(b => (
                <Input
                    key={b.url}
                    value={b.url}
                    noTopLabel
                    isDisabled
                    innerAddon={
                        <Button
                            variant="tertiary"
                            icon="CROSS"
                            onClick={() => removeBlockbookUrl(b)}
                        />
                    }
                />
            ))}

            <Input
                type="text"
                noTopLabel
                name={inputName}
                data-test={inputName}
                placeholder={props.intl.formatMessage(
                    messages.SETTINGS_ADV_COIN_URL_INPUT_PLACEHOLDER,
                    {
                        url: `https://${coin}1.trezor.io/`,
                    },
                )}
                innerRef={register({
                    validate: (value: string) => {
                        // Check if URL is valid
                        if (!isUrl(value)) {
                            return messages.TR_CUSTOM_BACKEND_INVALID_URL.id;
                        }

                        // Check if already exists
                        if (blockbookUrls.find(b => b.coin === coin && b.url === value)) {
                            return messages.TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED.id;
                        }
                    },
                })}
                state={error ? 'error' : undefined}
                // @ts-ignore: Accessing messages by providing the property as a string throws an error
                bottomText={error?.message && props.intl.formatMessage(messages[error.message])}
            />

            <AddButton variant="tertiary" icon="PLUS" onClick={addUrl} isDisabled={Boolean(error)}>
                <Translation id="TR_ADD_NEW_BLOCKBOOK_BACKEND" />
            </AddButton>
        </Wrapper>
    );
};

export default injectIntl(CustomBlockbookUrls);
