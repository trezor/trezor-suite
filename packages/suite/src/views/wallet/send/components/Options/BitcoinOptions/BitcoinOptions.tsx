import { useWatch } from 'react-hook-form';
import styled from 'styled-components';

import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { Button, Tooltip } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { Locktime } from './Locktime';
import { CoinControl } from './CoinControl/CoinControl';
import { OnOffSwitcher } from '../OnOffSwitcher';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    flex-flow: row wrap;
    flex: 1;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
    flex-wrap: wrap;
`;

const AddRecipientButton = styled(Button)`
    align-self: center;
`;

const Right = styled.div`
    display: flex;
`;

const StyledButton = styled(Button)`
    margin: 4px 8px 4px 0;
`;

export const BitcoinOptions = () => {
    const {
        network,
        addOutput,
        control,
        utxoSelection: { isCoinControlEnabled },
        getDefaultValue,
        toggleOption,
        composeTransaction,
        resetDefaultValue,
        setValue,
    } = useSendFormContext();

    const options = useWatch({
        name: 'options',
        defaultValue: getDefaultValue('options', []),
        control,
    });

    const locktimeEnabled = options.includes('bitcoinLockTime');
    const rbfEnabled = options.includes('bitcoinRBF');
    const utxoSelectionEnabled = options.includes('utxoSelection');
    const broadcastEnabled = options.includes('broadcast');

    const toggleUtxoSelection = () => {
        setValue('hasCoinControlBeenOpened', true); // required for analytics
        toggleOption('utxoSelection');
    };

    return (
        <Wrapper>
            {locktimeEnabled && (
                <Locktime
                    close={() => {
                        resetDefaultValue('bitcoinLockTime');
                        // close additional form
                        if (!rbfEnabled) toggleOption('bitcoinRBF');
                        if (!broadcastEnabled) toggleOption('broadcast');
                        toggleOption('bitcoinLockTime');
                        composeTransaction();
                    }}
                />
            )}
            {utxoSelectionEnabled && <CoinControl close={toggleUtxoSelection} />}

            <Row>
                <Left>
                    {!locktimeEnabled && (
                        <Tooltip
                            addon={instance => (
                                <OpenGuideFromTooltip
                                    id="/3_send-and-receive/transactions-in-depth/locktime.md"
                                    instance={instance}
                                />
                            )}
                            content={<Translation id="LOCKTIME_ADD_TOOLTIP" />}
                            cursor="pointer"
                        >
                            <StyledButton
                                variant="tertiary"
                                icon="CALENDAR"
                                onClick={() => {
                                    // open additional form
                                    toggleOption('bitcoinLockTime');
                                    composeTransaction();
                                }}
                                data-test="add-locktime-button"
                            >
                                <Translation id="LOCKTIME_ADD" />
                            </StyledButton>
                        </Tooltip>
                    )}
                    {isFeatureFlagEnabled('RBF') &&
                        network.features?.includes('rbf') &&
                        !locktimeEnabled && (
                            <Tooltip
                                addon={instance => (
                                    <OpenGuideFromTooltip
                                        id="/3_send-and-receive/5_replace-by-fee-rbf.md"
                                        instance={instance}
                                    />
                                )}
                                content={<Translation id="RBF_TOOLTIP" />}
                                cursor="pointer"
                            >
                                <StyledButton
                                    variant="tertiary"
                                    icon="RBF"
                                    onClick={() => {
                                        toggleOption('bitcoinRBF');
                                        composeTransaction();
                                    }}
                                >
                                    <Translation id="RBF" />
                                    <OnOffSwitcher isOn={rbfEnabled} />
                                </StyledButton>
                            </Tooltip>
                        )}
                    <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                        <StyledButton
                            variant="tertiary"
                            icon="BROADCAST"
                            onClick={() => {
                                toggleOption('broadcast');
                                composeTransaction();
                            }}
                            data-test="broadcast-button"
                        >
                            <Translation id="BROADCAST" />
                            <OnOffSwitcher isOn={broadcastEnabled} />
                        </StyledButton>
                    </Tooltip>
                    {!utxoSelectionEnabled && (
                        <Tooltip
                            addon={instance => (
                                <OpenGuideFromTooltip
                                    id="/5_coinjoin-and-coin-control/coin-control.md"
                                    instance={instance}
                                />
                            )}
                            content={<Translation id="TR_COIN_CONTROL_TOOLTIP" />}
                            cursor="pointer"
                        >
                            <StyledButton
                                variant="tertiary"
                                icon="COIN_CONTROL"
                                onClick={toggleUtxoSelection}
                            >
                                <Translation id="TR_COIN_CONTROL" />
                                {isCoinControlEnabled && <OnOffSwitcher isOn />}
                            </StyledButton>
                        </Tooltip>
                    )}
                </Left>
                <Right>
                    <AddRecipientButton
                        variant="tertiary"
                        icon="PLUS"
                        data-test="add-output"
                        onClick={addOutput}
                    >
                        <Translation id="RECIPIENT_ADD" />
                    </AddRecipientButton>
                </Right>
            </Row>
        </Wrapper>
    );
};
