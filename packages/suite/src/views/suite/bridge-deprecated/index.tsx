import { Box, Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { UNINSTALL_BRIDGE_URL } from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import { Metadata, Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
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
            bottomContent={
                <>
                    <Modal.Button
                        icon="caretLeft"
                        variant="tertiary"
                        onClick={() => goToWallet()}
                        data-testid="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </Modal.Button>
                </>
            }
            size="small"
            variant="warning"
            iconName="warning"
        >
            <Metadata title="Bridge | Trezor Suite" />
            <Column gap={spacings.xxs}>
                <H3>
                    <Translation id="TR_BRIDGE" />
                </H3>
                <Paragraph variant="tertiary">
                    <Translation
                        id="TR_BRIDGE_UNINSTALL_INSTRUCTIONS"
                        values={{
                            a: chunks => (
                                <Box margin={{ top: spacings.xs }}>
                                    <LearnMoreButton url={UNINSTALL_BRIDGE_URL}>
                                        {chunks}
                                    </LearnMoreButton>
                                </Box>
                            ),
                        }}
                    />
                </Paragraph>
            </Column>
        </Modal>
    );
};
