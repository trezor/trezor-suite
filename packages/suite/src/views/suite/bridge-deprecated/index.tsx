import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Column, H3, Link, Modal, Paragraph } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';
import { UNINSTALL_BRIDGE_URL } from '@trezor/urls';

import { Metadata } from 'src/components/suite';
import { useLayout } from 'src/hooks/suite';

/**
 * modal that should show users basic information how to uninstall old standalone bridge
 */
export const BridgeDeprecated = () => {
    const dispatch = useDispatch();
    const uninstallBridgeUrl = useExternalLink(UNINSTALL_BRIDGE_URL);

    useLayout('Bridge');

    const onClose = () => {
        dispatch(goto({ routeName: 'wallet-index' }));
    };

    return (
        <Modal
            bottomContent={
                <>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={onClose}
                        data-testid="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </Modal.Button>
                </>
            }
            width={600}
            intent="warning"
            icon={WarningIcon}
            onCancel={onClose}
            isBackdropCancelable
        >
            <Metadata title="Bridge | Trezor Suite" />
            <Column gap={4}>
                <H3>
                    <Translation id="TR_STANDALONE_BRIDGE_DEPRECATED" />
                </H3>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation
                        id="TR_STANDALONE_BRIDGE_DEPRECATED_DESCRIPTION"
                        values={{
                            a: chunks => <Link href={uninstallBridgeUrl}>{chunks}</Link>,
                        }}
                    />
                </Paragraph>
            </Column>
        </Modal>
    );
};
