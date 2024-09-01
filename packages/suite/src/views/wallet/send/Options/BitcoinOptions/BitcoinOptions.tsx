import { useWatch } from 'react-hook-form';
import styled from 'styled-components';

import { Button, Tooltip, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { Locktime } from './Locktime/Locktime';
import { CoinControl } from './CoinControl/CoinControl';
import { OnOffSwitcher } from '../OnOffSwitcher';
import { selectNetworkBlockchainInfo } from '@suite-common/wallet-core';
import { useSelector } from 'src/hooks/suite';
import { canLocktimeTxBeBroadcast } from './Locktime/canLocktimeTxBeBroadcast';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

const Row = styled.div`
    display: flex;
    flex-flow: row wrap;
    flex: 1;
    justify-content: space-between;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column-reverse;
        gap: ${spacingsPx.sm};
    }
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
    flex-wrap: wrap;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const AddRecipientButton = styled(Button)`
    align-self: center;
`;

const Right = styled.div`
    display: flex;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)`
    margin: 4px 8px 4px 0;
`;

const Inline = styled.span`
    display: inline-flex;
`;

export const BitcoinOptions = () => {
    const {
        addOutput,
        control,
        utxoSelection: { isCoinControlEnabled },
        getDefaultValue,
        toggleOption,
        composeTransaction,
        setDraftSaveRequest,
        resetDefaultValue,
        setValue,
        watch,
        network,
    } = useSendFormContext();

    const options = useWatch({
        name: 'options',
        defaultValue: getDefaultValue('options', []),
        control,
    });

    const locktimeEnabled = options.includes('bitcoinLockTime');
    const utxoSelectionEnabled = options.includes('utxoSelection');
    const broadcastEnabled = options.includes('broadcast');

    const toggleUtxoSelection = () => {
        setValue('hasCoinControlBeenOpened', true); // required for analytics
        toggleOption('utxoSelection');

        // This will trigger the effect in `useSendForm` and do `saveSendFormDraftThunk`.
        // This is not nice, but it will endure the new state is persisted in the Redux Store.
        // Without this, this change may be lost which will result in UI glitch (closing the Coin Control UI)
        setDraftSaveRequest(true);
    };

    const blockchain = useSelector(selectNetworkBlockchainInfo(network.symbol));

    const locktime = watch('bitcoinLockTime');

    const isBroadcastDisabled = !canLocktimeTxBeBroadcast({
        locktime: locktime !== undefined ? Number(locktime) : undefined,
        currentBlockHeight: blockchain.blockHeight,
    });

    return (
        <Wrapper>
            <Row>
                <Left>
                    {!locktimeEnabled && (
                        <Tooltip
                            addon={
                                <OpenGuideFromTooltip id="/3_send-and-receive/transactions-in-depth/locktime.md" />
                            }
                            content={<Translation id="LOCKTIME_ADD_TOOLTIP" />}
                            cursor="pointer"
                        >
                            <StyledButton
                                variant="tertiary"
                                size="small"
                                icon="calendar"
                                onClick={() => {
                                    // open additional form
                                    toggleOption('bitcoinLockTime');
                                    composeTransaction();
                                }}
                                data-testid="add-locktime-button"
                            >
                                <Translation id="LOCKTIME_ADD" />
                            </StyledButton>
                        </Tooltip>
                    )}
                    <Tooltip
                        content={
                            <Translation
                                id={
                                    isBroadcastDisabled
                                        ? 'BROADCAST_TOOLTIP_DISABLED_LOCKTIME'
                                        : 'BROADCAST_TOOLTIP'
                                }
                            />
                        }
                    >
                        <StyledButton
                            variant="tertiary"
                            size="small"
                            icon="broadcast"
                            onClick={() => {
                                toggleOption('broadcast');
                                composeTransaction();
                            }}
                            data-testid="broadcast-button"
                            isDisabled={isBroadcastDisabled}
                        >
                            <Inline>
                                <Translation id="BROADCAST" />
                                <OnOffSwitcher isOn={broadcastEnabled} />
                            </Inline>
                        </StyledButton>
                    </Tooltip>

                    {!utxoSelectionEnabled && (
                        <Tooltip
                            addon={
                                <OpenGuideFromTooltip id="/5_coinjoin-and-coin-control/coin-control.md" />
                            }
                            content={<Translation id="TR_COIN_CONTROL_TOOLTIP" />}
                            cursor="pointer"
                        >
                            <StyledButton
                                variant="tertiary"
                                size="small"
                                icon="coinControl"
                                onClick={toggleUtxoSelection}
                                data-testid="coin-control-button"
                            >
                                <Inline>
                                    <Translation id="TR_COIN_CONTROL" />
                                    {isCoinControlEnabled && <OnOffSwitcher isOn />}
                                </Inline>
                            </StyledButton>
                        </Tooltip>
                    )}
                </Left>

                <Right>
                    <AddRecipientButton
                        variant="tertiary"
                        size="small"
                        icon="plus"
                        data-testid="add-output"
                        onClick={addOutput}
                        isFullWidth
                    >
                        <Translation id="RECIPIENT_ADD" />
                    </AddRecipientButton>
                </Right>
            </Row>

            {locktimeEnabled && (
                <Locktime
                    close={() => {
                        resetDefaultValue('bitcoinLockTime');
                        // close additional form
                        if (!broadcastEnabled) toggleOption('broadcast');
                        toggleOption('bitcoinLockTime');
                        composeTransaction();
                    }}
                />
            )}

            {utxoSelectionEnabled && <CoinControl close={toggleUtxoSelection} />}
        </Wrapper>
    );
};
