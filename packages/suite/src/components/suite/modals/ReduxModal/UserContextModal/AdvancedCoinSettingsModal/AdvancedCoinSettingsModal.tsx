import { useState } from 'react';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    Button,
    Card,
    CollapsibleBox,
    Column,
    DotIndicator,
    Input,
    List,
    Modal,
    Row,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { toggleTor } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useBackendsForm, useDefaultUrls } from 'src/hooks/settings/backends';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectModalType } from 'src/reducers/suite/modalReducer';
import { selectTorState } from 'src/reducers/suite/suiteReducer';

import { BackendTypeSelect } from './CustomBackends/BackendTypeSelect';
import ConnectionInfo from './CustomBackends/ConnectionInfo';
import { TorModal, TorResult } from './CustomBackends/TorModal';

type AdvancedCoinSettingsModalProps = {
    symbol: NetworkSymbol;
    onCancel: () => void;
};

export const AdvancedCoinSettingsModal = ({ symbol, onCancel }: AdvancedCoinSettingsModalProps) => {
    const network = getNetwork(symbol);
    const { isTorEnabled } = useSelector(selectTorState);
    const blockchain = useSelector(state => state.wallet.blockchain);
    const modalType = useSelector(selectModalType);
    const dispatch = useDispatch();
    const [torModalOpen, setTorModalOpen] = useState(false);

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
                await dispatch(toggleTor(true, modalType));

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

    const { defaultUrls } = useDefaultUrls(symbol);
    const { ref: inputRef, ...inputField } = register(name, { validate });
    const isEditable = type !== 'default';
    const isSubmitButtonDisabled = isEditable && !!error;

    return torModalOpen ? (
        <TorModal onResult={onTorResult} />
    ) : (
        <Modal
            onCancel={onCancel}
            heading={
                <Text case="titlecase" as="p">
                    {network.name} <Translation id="TR_BACKENDS" />
                </Text>
            }
            description={
                <Translation
                    id={
                        network?.networkType === 'cardano'
                            ? 'SETTINGS_ADV_COIN_BLOCKFROST_DESCRIPTION'
                            : 'SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION'
                    }
                />
            }
            size="small"
            bottomContent={
                <>
                    <Modal.Button
                        onClick={onSaveClick}
                        isDisabled={isSubmitButtonDisabled}
                        data-testid="@settings/advance/button/save"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} variant="tertiary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.lg}>
                <Card
                    heading={
                        <BackendTypeSelect network={network} value={type} onChange={changeType} />
                    }
                >
                    <Column gap={spacings.xxl}>
                        {(urls.length || (!isEditable && defaultUrls.length)) && (
                            <List bulletComponent={<DotIndicator />} gap={spacings.sm}>
                                {(isEditable ? urls : defaultUrls).map(url => (
                                    <List.Item
                                        data-testid="@settings/advance/url"
                                        key={url}
                                        bulletComponent={
                                            url === blockchain[symbol]?.url ? (
                                                <DotIndicator isActive />
                                            ) : undefined
                                        }
                                    >
                                        <Row gap={spacings.sm}>
                                            <Text
                                                variant={
                                                    url === blockchain[symbol]?.url
                                                        ? 'default'
                                                        : 'tertiary'
                                                }
                                            >
                                                {url}
                                            </Text>
                                            {isEditable && (
                                                <Button
                                                    variant="tertiary"
                                                    size="tiny"
                                                    icon="trash"
                                                    onClick={() => removeUrl(url)}
                                                >
                                                    <Translation id="TR_REMOVE" />
                                                </Button>
                                            )}
                                        </Row>
                                    </List.Item>
                                ))}
                            </List>
                        )}
                        {isEditable && (
                            <Column gap={spacings.sm}>
                                <Input
                                    data-testid={`@settings/advance/${name}`}
                                    placeholder={placeholder}
                                    inputState={error ? 'error' : undefined}
                                    bottomText={error?.message || null}
                                    innerRef={inputRef}
                                    innerAddon={
                                        <Button
                                            variant="primary"
                                            size="tiny"
                                            icon="plus"
                                            data-testid="@settings/advance/button/add"
                                            onClick={() => {
                                                addUrl(value);
                                                reset();
                                            }}
                                            isDisabled={!!error || value === ''}
                                        >
                                            <Translation id="TR_ADD_NEW_BLOCKBOOK_BACKEND" />
                                        </Button>
                                    }
                                    {...inputField}
                                />
                            </Column>
                        )}
                    </Column>
                </Card>
                <CollapsibleBox heading={<Translation id="SETTINGS_ADV_COIN_CONN_INFO_TITLE" />}>
                    <ConnectionInfo symbol={symbol} />
                </CollapsibleBox>
            </Column>
        </Modal>
    );
};
