import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { H3, Modal, Paragraph } from '@trezor/components';

import { type AssetAccounts } from '../HomeAssetTable/homeAssetTableSelectors';
import { getAssetName, sumAssetAccounts } from '../HomeAssetTable/homeAssetTableUtils';

type UnhideAssetModalProps = {
    assetAccounts: AssetAccounts;
    onCancel: () => void;
};

export const UnhideAssetModal = ({ assetAccounts, onCancel }: UnhideAssetModalProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [{ symbol, contractAddress }] = assetAccounts;
    const { tokenInfo } = sumAssetAccounts(assetAccounts);

    const handleUnhide = () => {
        if (contractAddress !== undefined) {
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
                    <Modal.Button onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={handleUnhide}
                        data-testid="@hidden-tokens/unhide/confirm"
                    >
                        <Translation id="TR_HOME_ASSET_UNHIDE" />
                    </Modal.Button>
                </>
            }
        >
            <H3>
                <Translation
                    id="TR_HOME_ASSET_UNHIDE_TITLE"
                    values={{ asset: getAssetName({ symbol, tokenInfo }) }}
                />
            </H3>
            <Paragraph intent="neutral" priority="secondary" margin={{ top: 8 }}>
                <Translation id="TR_HOME_ASSET_UNHIDE_TEXT" />
            </Paragraph>
        </Modal>
    );
};
