import { useState } from 'react';

import { walletConnectPairThunk } from '@suite-common/walletconnect';
import { Button, Input, NewModal } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useDispatch, useTranslation } from 'src/hooks/suite';

export const WalletConnectButton = () => {
    const dispatch = useDispatch();
    const [connectionUrl, setConnectionUrl] = useState('');
    const [modalOpened, setModalOpened] = useState(false);
    const { translationString } = useTranslation();

    const handleConnect = () => {
        dispatch(walletConnectPairThunk({ uri: connectionUrl }));
        setConnectionUrl(''); // Clear input after attempt
        setModalOpened(false);
    };
    const onCancel = () => setModalOpened(false);

    return (
        <>
            {modalOpened && (
                <NewModal.Backdrop onClick={onCancel}>
                    <NewModal.ModalBase
                        heading={<Translation id="TR_WALLETCONNECT_ADD_CONNECTION" />}
                        description={<Translation id="TR_WALLETCONNECT_ADD_CONNECTION_DESC" />}
                        onCancel={onCancel}
                        size="small"
                        bottomContent={
                            <>
                                <NewModal.Button
                                    onClick={handleConnect}
                                    isDisabled={!connectionUrl}
                                >
                                    <Translation id="TR_CONNECT" />
                                </NewModal.Button>
                                <NewModal.Button variant="tertiary" onClick={onCancel}>
                                    <Translation id="TR_CANCEL" />
                                </NewModal.Button>
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
                    </NewModal.ModalBase>
                </NewModal.Backdrop>
            )}

            <Button
                icon="plus"
                variant="tertiary"
                size="small"
                onClick={() => setModalOpened(true)}
            >
                <Translation id="TR_WALLETCONNECT" />
            </Button>
        </>
    );
};
