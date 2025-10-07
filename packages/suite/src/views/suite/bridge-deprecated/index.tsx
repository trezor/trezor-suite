import { Column, H3, Link, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { UNINSTALL_BRIDGE_URL } from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import { Metadata } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useExternalLink, useLayout } from 'src/hooks/suite';

/**
 * modal that should show users basic information how to uninstall old standalone bridge
 */
export const BridgeDeprecated = () => {
    const dispatch = useDispatch();
    const uninstallBridgeUrl = useExternalLink(UNINSTALL_BRIDGE_URL);

    useLayout('Bridge');

    const onClose = () => {
        dispatch(goto('wallet-index'));
    };

    return (
        <Modal
            bottomContent={
                <>
                    <Modal.Button
                        variant="tertiary"
                        onClick={onClose}
                        data-testid="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </Modal.Button>
                </>
            }
            size="small"
            variant="warning"
            iconName="warning"
            onCancel={onClose}
            isBackdropCancelable
        >
            <Metadata title="Bridge | Trezor Suite" />
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_STANDALONE_BRIDGE_DEPRECATED" />
                </H3>
                <Paragraph variant="tertiary">
                    <Translation
                        id="TR_STANDALONE_BRIDGE_DEPRECATED_DESCRIPTION"
                        values={{
                            a: chunks => (
                                <Link href={uninstallBridgeUrl} icon="arrowUpRight">
                                    {chunks}
                                </Link>
                            ),
                        }}
                    />
                </Paragraph>
            </Column>
        </Modal>
    );
};
