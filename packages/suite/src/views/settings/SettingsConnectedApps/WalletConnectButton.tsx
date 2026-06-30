import { useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { walletConnectPairThunk } from '@suite-common/walletconnect';
import { Button, Input, Modal } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

import { useDispatch } from 'src/hooks/suite';

export const WalletConnectButton = () => {
    const dispatch = useDispatch();
    const [connectionUrl, setConnectionUrl] = useState('');
    const [modalOpened, setModalOpened] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const { translationString } = useTranslation();

    const handleConnect = async () => {
        setLoading(true);
        setConnectionUrl(''); // Clear input after attempt
        await dispatch(walletConnectPairThunk({ uri: connectionUrl }))
            .unwrap()
            .catch(error => {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: error.message,
                    }),
                );
            });
        setLoading(false);
        setModalOpened(false);
    };
    const handleOpen = () => setModalOpened(true);
    const onCancel = () => setModalOpened(false);

    return (
        <>
            {modalOpened && (
                <Modal.Backdrop onClick={onCancel}>
                    <Modal.ModalBase
                        heading={<Translation id="TR_WALLETCONNECT_ADD_CONNECTION" />}
                        description={<Translation id="TR_WALLETCONNECT_ADD_CONNECTION_DESC" />}
                        onCancel={onCancel}
                        width={600}
                        bottomContent={
                            <>
                                <Modal.Button
                                    onClick={handleConnect}
                                    isDisabled={!connectionUrl}
                                    isLoading={isLoading}
                                    data-testid="@walletconnect/connect-button"
                                >
                                    <Translation id="TR_CONNECT" />
                                </Modal.Button>
                                <Modal.Button
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={onCancel}
                                    data-testid="@walletconnect/cancel-button"
                                >
                                    <Translation id="TR_CANCEL" />
                                </Modal.Button>
                            </>
                        }
                    >
                        <Input
                            value={connectionUrl}
                            onChange={e => setConnectionUrl(e.target.value)}
                            placeholder={translationString(
                                'TR_WALLETCONNECT_ADD_CONNECTION_PLACEHOLDER',
                            )}
                            data-testid="@walletconnect/string-input"
                        />
                    </Modal.ModalBase>
                </Modal.Backdrop>
            )}

            <Button
                iconLeft={PlusIcon}
                intent="neutral"
                priority="secondary"
                size="small"
                onClick={() => handleOpen()}
                data-testid="@settings/walletconnect/add-with-button"
            >
                <Translation id="TR_ADD_WALLETCONNECT" />
            </Button>
        </>
    );
};
