import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    formatStakingAmount,
    selectStakingAccountPositionDetails,
    useStakingAccountPosition,
    useStakingProductTargets,
} from '@suite-common/earn-staking';
import { type StakingAmount } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import {
    Banner,
    Button,
    Card,
    Column,
    Modal,
    Paragraph,
    Row,
    Table,
    Text,
    Tooltip,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { TronStakeInfoRow } from '#src/components/earn/staking/tron/TronStakeInfoRow';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';
import { useSelector } from '#src/hooks/suite/useSelector';

import { TronVoteAllocationRow } from './TronVoteAllocationRow';
import { useTronStakingOperation } from '../hooks/useTronStakingOperation';

interface TronVoteAllocationModalProps {
    account: Account;
    onClose: () => void;
}

export const TronVoteAllocationModal = ({ account, onClose }: TronVoteAllocationModalProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const { productId, position } = useStakingAccountPosition(account.key);

    const stakingDetails = useSelector(state =>
        selectStakingAccountPositionDetails(state, account.key, 'tron-staking'),
    );

    const representatives = useStakingProductTargets(productId);
    const vote = useTronStakingOperation(productId, 'vote');
    const { openFirmwareModal, isFirmwareModalOpen, firmwareModal } = useTronFirmwareUpgradeModal();

    const formatAmount = (amount: StakingAmount) =>
        formatStakingAmount({ amount, networkSymbol: account.symbol });

    const remainingVotes =
        stakingDetails === null ? '0' : formatAmount(stakingDetails.unallocatedVotingPower);
    const totalVotes = stakingDetails === null ? '0' : formatAmount(stakingDetails.votingPower);
    const assignedVotes = BigNumber.max(
        new BigNumber(totalVotes).minus(remainingVotes),
        0,
    ).toFixed();
    const hasRemainingVotes = isPositiveBalance(remainingVotes);
    const votes = position?.targets ?? [];
    const hasVotes = votes.length > 0;

    const goToVote = () => {
        if (vote.isDisabled) return;

        if (vote.isFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_VOTE');

            return;
        }

        dispatch(
            gotoThunk({
                routeName: 'earn-tron-vote',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
        onClose();

        analytics.report({
            type: events.stakingUpdateProviderEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <>
            {firmwareModal}

            {/* Every mounted modal handles Escape, so the dialog yields it to the prompt above. */}
            <Modal
                width={600}
                data-testid="@modal/tron-vote-allocation"
                heading={<Translation id="TR_EARN_TRON_VOTE_ALLOCATION" />}
                onCancel={onClose}
                isBackdropCancelable={!isFirmwareModalOpen}
            >
                <Column gap={16} alignItems="stretch">
                    <Card type="contrast" paddingType="none">
                        <TronStakeInfoRow
                            label={<Translation id="TR_EARN_TRON_ASSIGNED_VOTES_LABEL" />}
                        >
                            <Text
                                typographyStyle="body-md-strong"
                                data-testid="@modal/tron-vote-allocation/assigned-votes"
                            >
                                {assignedVotes}/{totalVotes}
                            </Text>
                        </TronStakeInfoRow>
                    </Card>

                    {hasRemainingVotes && (
                        <Banner
                            intent="info"
                            icon
                            description={<Translation id="TR_EARN_TRON_ASSIGN_VOTES_BANNER" />}
                            rightContent={
                                <Tooltip content={vote.message}>
                                    <Banner.Button
                                        onClick={goToVote}
                                        isDisabled={vote.isDisabled}
                                        data-testid="@modal/tron-vote-allocation/vote-button"
                                    >
                                        <Translation id="TR_EARN_TRON_VOTE" />
                                    </Banner.Button>
                                </Tooltip>
                            }
                        />
                    )}

                    <Card paddingType="none">
                        <Table>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Cell>
                                        <Translation id="TR_EARN_TRON_REPRESENTATIVE" />
                                    </Table.Cell>

                                    <Table.Cell>
                                        <Translation id="TR_TRON_VOTES" />
                                    </Table.Cell>

                                    <Table.Cell>
                                        <Translation id="TR_EARN_TRON_APR_LABEL" />
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {hasVotes ? (
                                    votes.map(target => (
                                        <TronVoteAllocationRow
                                            key={target.address}
                                            target={target}
                                            rate={
                                                representatives.find(
                                                    ({ address }) => address === target.address,
                                                )?.rate ?? null
                                            }
                                            symbol={account.symbol}
                                        />
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell colSpan={3} align="center">
                                            <Paragraph
                                                typographyStyle="body-sm"
                                                intent="neutral"
                                                priority="secondary"
                                            >
                                                <Translation id="TR_EARN_TRON_NO_VOTES" />
                                            </Paragraph>
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    </Card>

                    {hasVotes && (
                        <Row>
                            <Tooltip content={vote.message}>
                                <Button
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={goToVote}
                                    isDisabled={vote.isDisabled}
                                    data-testid="@modal/tron-vote-allocation/change-votes-button"
                                >
                                    <Translation id="TR_EARN_TRON_CHANGE_VOTES" />
                                </Button>
                            </Tooltip>
                        </Row>
                    )}
                </Column>
            </Modal>
        </>
    );
};
