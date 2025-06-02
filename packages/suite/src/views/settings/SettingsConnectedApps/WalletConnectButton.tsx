import { useState } from 'react';

import { walletConnectPairThunk } from '@suite-common/walletconnect';
import { Button, Input, Modal } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useDispatch, useTranslation } from 'src/hooks/suite';

interface WalletConnectButtonProps {
    handleOpened: () => void;
}

export const WalletConnectButton = ({ handleOpened }: WalletConnectButtonProps) => {
    const dispatch = useDispatch();
    const [connectionUrl, setConnectionUrl] = useState('');
    const [modalOpened, setModalOpened] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const { translationString } = useTranslation();

    const handleConnect = async () => {
        setLoading(true);
        setConnectionUrl(''); // Clear input after attempt
        await dispatch(walletConnectPairThunk({ uri: connectionUrl }));
        setLoading(false);
        setModalOpened(false);
    };
    const handleOpen = () => {
        setModalOpened(true);
        handleOpened();
    };
    const onCancel = () => setModalOpened(false);

    return (
        <>
            {modalOpened && (
                <Modal.Backdrop onClick={onCancel}>
                    <Modal.ModalBase
                        heading={<Translation id="TR_WALLETCONNECT_ADD_CONNECTION" />}
                        description={<Translation id="TR_WALLETCONNECT_ADD_CONNECTION_DESC" />}
                        onCancel={onCancel}
                        size="small"
                        bottomContent={
                            <>
                                <Modal.Button
                                    onClick={handleConnect}
                                    isDisabled={!connectionUrl}
                                    isLoading={isLoading}
                                >
                                    <Translation id="TR_CONNECT" />
                                </Modal.Button>
                                <Modal.Button variant="tertiary" onClick={onCancel}>
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
                        />
                    </Modal.ModalBase>
                </Modal.Backdrop>
            )}

            <Button icon="plus" variant="tertiary" size="small" onClick={() => handleOpen()}>
                <Translation id="TR_ADD_WALLETCONNECT" />
            </Button>
        </>
    );
};
