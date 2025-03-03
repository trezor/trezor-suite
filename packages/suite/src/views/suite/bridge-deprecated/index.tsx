import { Button, Link } from '@trezor/components';
import { UNINSTALL_BRIDGE_URL } from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import { Metadata, Modal, Translation } from 'src/components/suite';
import { useDispatch, useLayout } from 'src/hooks/suite';

/**
 * modal that should show users basic information how to uninstall old standalone bridge
 */
export const BridgeDeprecated = () => {
    const dispatch = useDispatch();

    const goToWallet = () => dispatch(goto('wallet-index'));

    useLayout('Bridge');

    return (
        <Modal
            heading={<Translation id="TR_YOUR_BRIDGE_VERSION_WILL_SOON_BE_DEPRECATED" />}
            description={
                <Translation
                    id="TR_BRIDGE_UNINSTALL_INSTRUCTIONS"
                    values={{
                        a: chunks => (
                            <Link href={UNINSTALL_BRIDGE_URL} typographyStyle="hint">
                                {chunks}
                            </Link>
                        ),
                    }}
                />
            }
            isHeadingCentered
            bottomBarComponents={
                <>
                    <Button
                        icon="caretLeft"
                        variant="tertiary"
                        onClick={() => goToWallet()}
                        data-testid="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </Button>
                </>
            }
        >
            <Metadata title="Bridge | Trezor Suite" />
        </Modal>
    );
};
