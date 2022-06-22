import React, { useState } from 'react';
import styled from 'styled-components';
import { Input, Button, H3 } from '@trezor/components';
import { Translation, TooltipSymbol, CollapsibleBox } from '@suite-components';
import InputError from '@wallet-components/InputError';
import { useSelector, useActions } from '@suite-hooks';
import { toggleTor as toggleTorAction } from '@suite-actions/suiteActions';
import { useDefaultUrls, useBackendsForm } from '@settings-hooks/backends';
import { getIsTorEnabled, toTorUrl } from '@suite-utils/tor';
import ConnectionInfo from './ConnectionInfo';
import { BackendInput } from './BackendInput';
import { BackendTypeSelect } from './BackendTypeSelect';
import { TorModal, TorResult } from './TorModal';
import type { Network } from '@wallet-types';

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
    background: transparent;
    box-shadow: none;
    margin-top: 16px;

    > div:first-child {
        padding: 12px 0;
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};

        :hover {
            background-color: ${({ theme }) => theme.BG_LIGHT_GREY};
        }
    }
`;

interface CustomBackendsProps {
    network: Network;
    onCancel: () => void;
}

export const CustomBackends = ({ network, onCancel }: CustomBackendsProps) => {
    const { blockchain, isTorEnabled } = useSelector(state => ({
        blockchain: state.wallet.blockchain,
        isTorEnabled: getIsTorEnabled(state.suite.torStatus),
    }));
    const [torModalOpen, setTorModalOpen] = useState(false);

    const { toggleTor } = useActions({
        toggleTor: toggleTorAction,
    });

    const { symbol: coin } = network;

    const { type, urls, input, changeType, addUrl, removeUrl, save, hasOnlyOnions } =
        useBackendsForm(coin);

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
                await toggleTor(true);

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

    const defaultUrls = useDefaultUrls(coin);
    const editable = type !== 'default';

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

                {(editable ? urls : defaultUrls).map(u => {
                    const url = isTorEnabled && !editable ? toTorUrl(u) : u;
                    return (
                        <BackendInput
                            key={url}
                            url={url}
                            active={url === blockchain[coin]?.url}
                            onRemove={editable ? () => removeUrl(u) : undefined}
                        />
                    );
                })}

                {editable && (
                    <Input
                        type="text"
                        noTopLabel
                        name={input.name}
                        data-test={`@settings/advance/${input.name}`}
                        placeholder={input.placeholder}
                        innerRef={input.ref}
                        inputState={input.error ? 'error' : undefined}
                        bottomText={<InputError error={input.error} />}
                    />
                )}

                {editable && (
                    <AddUrlButton
                        variant="tertiary"
                        icon="PLUS"
                        data-test="@settings/advance/button/add"
                        onClick={() => {
                            addUrl(input.value);
                            input.reset();
                        }}
                        isDisabled={!!input.error || input.value === ''}
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
                    isDisabled={!!input.error}
                    data-test="@settings/advance/button/save"
                >
                    <Translation id="TR_CONFIRM" />
                </SaveButton>
            </Wrapper>

            {torModalOpen && <TorModal onResult={onTorResult} />}
        </>
    );
};
