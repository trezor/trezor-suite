import { useState } from 'react';

import styled from 'styled-components';

import { Network } from '@suite-common/wallet-config';
import { Button, CollapsibleBox, Column, H3, Input } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { toggleTor } from 'src/actions/suite/suiteActions';
import { TooltipSymbol, Translation } from 'src/components/suite';
import { useBackendsForm, useDefaultUrls } from 'src/hooks/settings/backends';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/reducers/suite/suiteReducer';

import { BackendInput } from './BackendInput';
import { BackendTypeSelect } from './BackendTypeSelect';
import ConnectionInfo from './ConnectionInfo';
import { TorModal, TorResult } from './TorModal';

// eslint-disable-next-line local-rules/no-override-ds-component
const AddUrlButton = styled(Button)`
    align-self: end;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Heading = styled(H3)`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    margin-bottom: 6px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const SaveButton = styled(Button)`
    width: 200px;
    margin-top: 30px;
    align-self: center;
`;

interface CustomBackendsProps {
    network: Network;
    onCancel: () => void;
}

export const CustomBackends = ({ network, onCancel }: CustomBackendsProps) => {
    const { isTorEnabled } = useSelector(selectTorState);
    const blockchain = useSelector(state => state.wallet.blockchain);
    const dispatch = useDispatch();
    const [torModalOpen, setTorModalOpen] = useState(false);

    const { symbol } = network;

    const {
        type,
        urls,
        input: { error, name, placeholder, register, reset, validate, value },
        changeType,
        addUrl,
        removeUrl,
        save,
        hasOnlyOnions,
    } = useBackendsForm(symbol);

    const onSaveClick = () => {
        if (!isTorEnabled && hasOnlyOnions()) {
            setTorModalOpen(true);
        } else {
            save();
            onCancel();
        }
    };

    const onTorResult = async (result: TorResult) => {
        switch (result) {
            case 'enable-tor':
                await dispatch(toggleTor(true));

                setTorModalOpen(false);
                save();
                onCancel();

                break;
            case 'use-defaults':
                changeType('default');
                setTorModalOpen(false);

            // no default
        }
    };

    const { defaultUrls, isLoading } = useDefaultUrls(symbol);
    const { ref: inputRef, ...inputField } = register(name, { validate });
    const isEditable = type !== 'default';
    const isSubmitButtonDisabled = isEditable && !!error;

    return (
        <>
            <Column gap={spacings.sm}>
                <Heading>
                    <Translation id="TR_BACKENDS" />
                    <TooltipSymbol
                        content={
                            <Column>
                                <Translation
                                    id={
                                        network?.networkType === 'cardano'
                                            ? 'SETTINGS_ADV_COIN_BLOCKFROST_DESCRIPTION'
                                            : 'SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION'
                                    }
                                />
                                <Translation
                                    id="TR_DEFAULT_VALUE"
                                    values={{
                                        value: defaultUrls.join(', ') ?? '',
                                    }}
                                />
                            </Column>
                        }
                    />
                </Heading>

                <BackendTypeSelect network={network} value={type} onChange={changeType} />

                {(isEditable ? urls : defaultUrls).map(url => (
                    <BackendInput
                        data-testid="@settings/advance/url"
                        key={url}
                        url={url}
                        isActive={url === blockchain[symbol]?.url}
                        isLoading={isLoading}
                        onRemove={isEditable ? () => removeUrl(url) : undefined}
                    />
                ))}

                {isEditable && (
                    <Input
                        data-testid={`@settings/advance/${name}`}
                        placeholder={placeholder}
                        inputState={error ? 'error' : undefined}
                        bottomText={error?.message || null}
                        innerRef={inputRef}
                        {...inputField}
                    />
                )}

                {isEditable && (
                    <AddUrlButton
                        variant="tertiary"
                        icon="plus"
                        data-testid="@settings/advance/button/add"
                        onClick={() => {
                            addUrl(value);
                            reset();
                        }}
                        isDisabled={!!error || value === ''}
                    >
                        <Translation id="TR_ADD_NEW_BLOCKBOOK_BACKEND" />
                    </AddUrlButton>
                )}

                <CollapsibleBox
                    paddingType="large"
                    heading={<Translation id="SETTINGS_ADV_COIN_CONN_INFO_TITLE" />}
                    margin={{ top: spacings.md }}
                >
                    <ConnectionInfo symbol={symbol} />
                </CollapsibleBox>

                <SaveButton
                    variant="primary"
                    onClick={onSaveClick}
                    isDisabled={isSubmitButtonDisabled}
                    data-testid="@settings/advance/button/save"
                >
                    <Translation id="TR_CONFIRM" />
                </SaveButton>
            </Column>

            {torModalOpen && <TorModal onResult={onTorResult} />}
        </>
    );
};
