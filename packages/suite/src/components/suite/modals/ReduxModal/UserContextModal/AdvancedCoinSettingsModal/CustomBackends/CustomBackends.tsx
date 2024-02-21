import { useState } from 'react';
import styled from 'styled-components';

import { Input, Button, H3, CollapsibleBox } from '@trezor/components';
import { Translation, TooltipSymbol } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { toggleTor } from 'src/actions/suite/suiteActions';
import { useDefaultUrls, useBackendsForm } from 'src/hooks/settings/backends';
import ConnectionInfo from './ConnectionInfo';
import { BackendInput } from './BackendInput';
import { BackendTypeSelect } from './BackendTypeSelect';
import { TorModal, TorResult } from './TorModal';
import type { Network } from 'src/types/wallet';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;

    > * + * {
        margin-top: 8px;
    }
`;

const AddUrlButton = styled(Button)`
    align-self: end;
    margin-top: 0;
`;

const Heading = styled(H3)`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    margin-bottom: 6px;
`;

const TooltipContent = styled.div`
    display: flex;
    flex-direction: column;
`;

const SaveButton = styled(Button)`
    width: 200px;
    margin-top: 30px;
    align-self: center;
`;

const TransparentCollapsibleBox = styled(CollapsibleBox)`
    margin-top: ${spacingsPx.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation2};

    /* to be removed when elevation context is added to the CollapsibleBox */
    box-shadow: none;
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

    const { symbol: coin } = network;

    const {
        type,
        urls,
        input: { error, name, placeholder, register, reset, validate, value },
        changeType,
        addUrl,
        removeUrl,
        save,
        hasOnlyOnions,
    } = useBackendsForm(coin);

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

    const { defaultUrls, isLoading } = useDefaultUrls(coin);
    const editable = type !== 'default';
    const { ref: inputRef, ...inputField } = register(name, { validate });

    return (
        <>
            <Wrapper>
                <Heading>
                    <Translation id="TR_BACKENDS" />
                    <TooltipSymbol
                        content={
                            <TooltipContent>
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
                            </TooltipContent>
                        }
                    />
                </Heading>

                <BackendTypeSelect network={network} value={type} onChange={changeType} />

                {(editable ? urls : defaultUrls).map(url => (
                    <BackendInput
                        key={url}
                        url={url}
                        isActive={url === blockchain[coin]?.url}
                        isLoading={isLoading}
                        onRemove={editable ? () => removeUrl(url) : undefined}
                    />
                ))}

                {editable && (
                    <Input
                        data-test-id={`@settings/advance/${name}`}
                        placeholder={placeholder}
                        inputState={error ? 'error' : undefined}
                        bottomText={error?.message || null}
                        innerRef={inputRef}
                        {...inputField}
                    />
                )}

                {editable && (
                    <AddUrlButton
                        variant="tertiary"
                        icon="PLUS"
                        data-test-id="@settings/advance/button/add"
                        onClick={() => {
                            addUrl(value);
                            reset();
                        }}
                        isDisabled={!!error || value === ''}
                    >
                        <Translation id="TR_ADD_NEW_BLOCKBOOK_BACKEND" />
                    </AddUrlButton>
                )}

                <TransparentCollapsibleBox
                    variant="large"
                    heading={<Translation id="SETTINGS_ADV_COIN_CONN_INFO_TITLE" />}
                >
                    <ConnectionInfo coin={coin} />
                </TransparentCollapsibleBox>

                <SaveButton
                    variant="primary"
                    onClick={onSaveClick}
                    isDisabled={!!error}
                    data-test-id="@settings/advance/button/save"
                >
                    <Translation id="TR_CONFIRM" />
                </SaveButton>
            </Wrapper>

            {torModalOpen && <TorModal onResult={onTorResult} />}
        </>
    );
};
