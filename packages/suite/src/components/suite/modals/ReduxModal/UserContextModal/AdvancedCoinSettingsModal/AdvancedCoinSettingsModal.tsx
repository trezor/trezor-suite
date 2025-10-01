import { useState } from 'react';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Badge, Card, CollapsibleBox, Column, Modal, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { toggleTor } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite/Translation';
import { useBackendsForm } from 'src/hooks/settings/backends';
import { useExplorerForm } from 'src/hooks/settings/useExplorerForm';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectModalType } from 'src/reducers/suite/modalReducer';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';

import { BackendUrls } from './BackendUrls/BackendUrls';
import { BackendTypeSelect } from './CustomBackends/BackendTypeSelect';
import ConnectionInfo from './CustomBackends/ConnectionInfo';
import { TorModal, TorResult } from './CustomBackends/TorModal';
import { ExplorerConfigForm } from './ExplorerConfigForm';

type AdvancedCoinSettingsModalProps = {
    symbol: NetworkSymbol;
    onCancel: () => void;
};

export const AdvancedCoinSettingsModal = ({ symbol, onCancel }: AdvancedCoinSettingsModalProps) => {
    const network = getNetwork(symbol);
    const { isTorEnabled } = useSelector(selectTorState);
    const modalType = useSelector(selectModalType);
    const dispatch = useDispatch();
    const [torModalOpen, setTorModalOpen] = useState(false);

    const explorer = useSelector(state => state.wallet.explorer[symbol]);
    const usesCustomExplorer = explorer.custom !== undefined;

    const explorerForm = useExplorerForm(symbol);
    const backendsForm = useBackendsForm(symbol);

    const onSaveClick = () => {
        explorerForm.save();

        if (!isTorEnabled && backendsForm.hasOnlyOnions()) {
            setTorModalOpen(true);
        } else {
            backendsForm.save();
            onCancel();
        }
    };

    const onTorResult = async (result: TorResult) => {
        switch (result) {
            case 'enable-tor':
                await dispatch(toggleTor(true, modalType));

                setTorModalOpen(false);
                backendsForm.save();
                onCancel();

                break;
            case 'use-defaults':
                backendsForm.changeType('default');
                setTorModalOpen(false);

            // no default
        }
    };

    const isEditable = backendsForm.type !== 'default';
    const isSubmitButtonDisabled =
        (isEditable && !!backendsForm.input.error) || !explorerForm.isValid;

    if (torModalOpen) {
        return <TorModal onResult={onTorResult} />;
    }

    return (
        <Modal
            onCancel={onCancel}
            heading={
                <Text as="p">
                    {network.name} <Translation id="TR_BACKENDS" />
                </Text>
            }
            description={<Translation id="SETTINGS_BACKEND_SETTINGS_DESCRIPTION" />}
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
                    header={
                        <BackendTypeSelect
                            network={network}
                            value={backendsForm.type}
                            onChange={backendsForm.changeType}
                        />
                    }
                >
                    <BackendUrls
                        symbol={symbol}
                        isEditable={isEditable}
                        input={backendsForm.input}
                        urls={backendsForm.urls}
                        addUrl={backendsForm.addUrl}
                        removeUrl={backendsForm.removeUrl}
                    />
                </Card>

                <CollapsibleBox
                    heading={
                        <Row gap={spacings.sm}>
                            <Translation id="TR_EXPLORER" />

                            {usesCustomExplorer ? (
                                <Badge variant="warning">
                                    <Translation id="TR_EXPLORER_CUSTOM" />
                                </Badge>
                            ) : (
                                <Badge variant="primary">
                                    <Translation id="TR_EXPLORER_DEFAULT" />
                                </Badge>
                            )}
                        </Row>
                    }
                >
                    <ExplorerConfigForm form={explorerForm} />
                </CollapsibleBox>

                <CollapsibleBox heading={<Translation id="SETTINGS_ADV_COIN_CONN_INFO_TITLE" />}>
                    <ConnectionInfo symbol={symbol} />
                </CollapsibleBox>
            </Column>
        </Modal>
    );
};
