import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { OnOffSwitcher } from '@wallet-components';
import { Button, Tooltip } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { OpenGuideFromTooltip } from '@guide-components';
import { Locktime } from './components/Locktime';
import { CoinControl } from './components/CoinControl';

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
    margin: 4px 8px 4px 0px;
`;

export const BitcoinOptions = () => {
    const {
        network,
        addOutput,
        getDefaultValue,
        isCoinControlEnabled,
        toggleOption,
        composeTransaction,
        resetDefaultValue,
    } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const locktimeEnabled = options.includes('bitcoinLockTime');
    const rbfEnabled = options.includes('bitcoinRBF');
    const utxoSelectionEnabled = options.includes('utxoSelection');
    const broadcastEnabled = options.includes('broadcast');

    return (
        <Wrapper>
            {utxoSelectionEnabled && (
                <CoinControl
                    close={() => {
                        resetDefaultValue('utxoSelection');
                        toggleOption('utxoSelection');
                        composeTransaction();
                    }}
                />
            )}
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

            <Row>
                <Left>
                    {!locktimeEnabled && (
                        <Tooltip
                            guideAnchor={instance => (
                                <OpenGuideFromTooltip
                                    id="/suite-basics/send/locktime.md"
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
                                guideAnchor={instance => (
                                    <OpenGuideFromTooltip
                                        id="/suite-basics/send/rbf-replace-by-fee.md"
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
                        // <Tooltip
                        //     guideAnchor={instance => (
                        //         <OpenGuideFromTooltip
                        //             id="/suite-basics/send/coin-selection.md"
                        //             instance={instance}
                        //         />
                        //     )}
                        //     content={<span>Coin selection tooltip...</span>}
                        //     cursor="pointer"
                        // >
                        <StyledButton
                            variant="tertiary"
                            icon="COIN_CONTROL"
                            onClick={() => {
                                // open additional form
                                toggleOption('utxoSelection');
                                composeTransaction();
                            }}
                        >
                            <Translation id="TR_COIN_CONTROL" />
                            {isCoinControlEnabled && <OnOffSwitcher isOn />}
                        </StyledButton>
                        // </Tooltip>
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
