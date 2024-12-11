import { Icon, Link, NewModal, Row, Column, Text, Card, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { getNetworkName } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite/useSelector';
import { useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { Translation } from 'src/components/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

export const CardanoWithdrawModal = ({ onCancel }: { onCancel: () => void }) => {
    const { voteAbstain, voteDelegate } = useCardanoStaking();
    const account = useSelector(state => selectSelectedAccount(state));

    if (!account || account.networkType !== 'cardano') {
        throw Error(
            'CardanoWithdrawModal used for other network or account in selectedAccount is undefined',
        );
    }

    const cardanoNetwork = getNetworkName(account.symbol);
    const { trezorDRep } = useSelector(state => state.wallet.cardanoStaking[cardanoNetwork]);
    const trezorDRepBech32 = trezorDRep?.drep.bech32;

    return (
        <NewModal
            onCancel={onCancel}
            heading={<Translation id="TR_CARDANO_WITHDRAW_MODAL_TITLE" />}
            bottomContent={
                <>
                    <NewModal.Button onClick={() => voteDelegate()}>
                        <Translation id="TR_CARDANO_WITHDRAW_MODAL_BUTTON_DELEGATE" />
                    </NewModal.Button>
                    <NewModal.Button onClick={() => voteAbstain()} variant="tertiary">
                        <Translation id="TR_CARDANO_WITHDRAW_MODAL_BUTTON_ABSTAIN" />
                    </NewModal.Button>
                </>
            }
        >
            <Paragraph variant="tertiary">
                <Translation id="TR_CARDANO_WITHDRAW_MODAL_TITLE_DESCRIPTION" />
            </Paragraph>
            <Row padding={{ top: spacings.xl }}>
                <Column gap={spacings.md}>
                    <Text>
                        <Translation id="TR_CARDANO_WITHDRAW_MODAL_SUB_TITLE" />
                    </Text>
                    <Card>
                        <Row>
                            {trezorDRepBech32}
                            <Link href={`https://gov.tools/drep_directory/${trezorDRepBech32}`}>
                                <Row padding={{ left: spacings.sm }}>
                                    <Icon name="link" size={16} />
                                </Row>
                            </Link>
                        </Row>
                    </Card>
                </Column>
            </Row>
        </NewModal>
    );
};
