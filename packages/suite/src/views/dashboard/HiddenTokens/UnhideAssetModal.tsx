import { Translation } from '@suite/intl';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { type HiddenTokenReason, type WalletAssetKey } from '@suite-common/wallet-core';
import { H3, Modal, Paragraph } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type UnhideAssetModalProps = {
    assetKey: WalletAssetKey;
    reason: HiddenTokenReason;
    onCancel: () => void;
};

export const UnhideAssetModal = ({ assetKey, reason, onCancel }: UnhideAssetModalProps) => {
    const { dispatch } = useServices(injectDispatch);
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const displaySymbol = useSelector(state => selectWalletAssetDisplaySymbol(state, assetKey));

    const handleUnhide = () => {
        if (symbol !== undefined && contractAddress !== undefined) {
            dispatch(
                tokenDefinitionsActions.setTokenStatus({
                    symbol,
                    contractAddress,
                    status: TokenManagementAction.SHOW,
                    type: DefinitionType.COIN,
                }),
            );
        }
        onCancel();
    };

    return (
        <Modal
            onCancel={onCancel}
            data-testid="@hidden-tokens/unhide"
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleUnhide}
                        data-testid="@hidden-tokens/unhide/confirm"
                    >
                        <Translation id="TR_HOME_ASSET_UNHIDE" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <H3>
                <Translation id="TR_HOME_ASSET_UNHIDE_TITLE" values={{ asset: displaySymbol }} />
            </H3>
            <Paragraph intent="neutral" priority="secondary" margin={{ top: 8 }}>
                <Translation
                    id={
                        reason === 'unrecognized'
                            ? 'TR_HOME_ASSET_UNHIDE_UNRECOGNIZED_TEXT'
                            : 'TR_HOME_ASSET_UNHIDE_TEXT'
                    }
                />
            </Paragraph>
        </Modal>
    );
};
