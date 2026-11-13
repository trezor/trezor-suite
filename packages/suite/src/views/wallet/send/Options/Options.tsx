import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { type FormOptions } from '@suite-common/wallet-types';
import { Button, Column, Row, Tooltip } from '@trezor/components';
import { CircleDashedIcon, PlusIcon } from '@trezor/icons';

import { OpenGuideFromTooltip } from '#src/components/guide';
import { useSendFormContext } from '#src/hooks/wallet';

import { CoinControl } from './CoinControl/CoinControl';
import { Locktime } from './Locktime/Locktime';
import { OnOffSwitcher } from './OnOffSwitcher';
import { TransactionData } from './TransactionData';
import { NoncePanel as DefaultNoncePanel } from './sendOptions/NoncePanel';
import { OptionalMemo } from './sendOptions/OptionalMemo';
import type { SendOptionPanels } from './sendOptions/sendOptionPanels';
import { sendOptionsOverrides } from './sendOptions/sendOptionsOverrides';
import { useSendOptions } from './sendOptions/useSendOptions';

// The registry is keyed by family id; a resolved network names its family as a plain string.
const overridesByFamily: Readonly<Partial<Record<string, Partial<SendOptionPanels>>>> =
    sendOptionsOverrides;

/**
 * The send options the user turned on, each rendered from what the network offers. Nothing here
 * asks which network it is on; a family that presents a panel its own way registers an override.
 */
export const Options = () => {
    const {
        addOutput,
        control,
        utxoSelection: { isCoinControlEnabled },
        toggleOption,
        composeTransaction,
        setDraftSaveRequest,
        resetDefaultValue,
        setValue,
    } = useSendFormContext();
    const { family, options } = useSendOptions();
    const { NoncePanel = DefaultNoncePanel } =
        (family === undefined ? undefined : overridesByFamily[family]) ?? {};

    const enabled = useWatch({ name: 'options', control }) ?? [];
    const isEnabled = (option: FormOptions) => enabled.includes(option);
    const isDataUnavailable = options.data?.unavailable !== undefined;
    const isDataEnabled = isEnabled('transactionData');

    // Data goes only where the network allows it, such as not with a token transfer.
    useEffect(() => {
        if (isDataUnavailable && isDataEnabled) {
            toggleOption('transactionData');
            resetDefaultValue('transactionData');
        }
    }, [isDataUnavailable, isDataEnabled, toggleOption, resetDefaultValue]);

    const toggle = (option: FormOptions) => {
        toggleOption(option);
        composeTransaction();
    };

    const toggleUtxoSelection = () => {
        setValue('hasCoinControlBeenOpened', true); // required for analytics
        toggleOption('utxoSelection');

        // Triggers the effect in `useSendForm` that runs `saveSendFormDraftThunk`, so the open
        // Coin Control survives in the store; without it the panel may close on the next render.
        setDraftSaveRequest(true);
    };

    const closeLocktime = () => {
        resetDefaultValue('bitcoinLocktimeBlockHeight');
        resetDefaultValue('bitcoinLocktimeDatetime');
        if (!isEnabled('broadcast')) toggleOption('broadcast');
        toggle('bitcoinLocktime');
    };

    const cancelNonceOverride = () => {
        setValue('ethereumNonce', '');
        toggle('ethereumNonce');
    };

    const showCoinControlButton = options.coinControl && !isEnabled('utxoSelection');
    const { memo, data, nonceOverride } = options;

    return (
        <Column gap={16}>
            {(showCoinControlButton || options.multipleRecipients) && (
                <Row justifyContent="space-between">
                    {showCoinControlButton && (
                        <Tooltip
                            addon={
                                <OpenGuideFromTooltip id="/3_send-and-receive/transactions-in-depth/coin-control.md" />
                            }
                            content={<Translation id="TR_COIN_CONTROL_TOOLTIP" />}
                            cursor="pointer"
                        >
                            <Button
                                intent="neutral"
                                priority="secondary"
                                iconLeft={CircleDashedIcon}
                                onClick={toggleUtxoSelection}
                                data-testid="coin-control-button"
                            >
                                <Row>
                                    <Translation id="TR_COIN_CONTROL" />
                                    {isCoinControlEnabled && <OnOffSwitcher isOn />}
                                </Row>
                            </Button>
                        </Tooltip>
                    )}

                    {options.multipleRecipients && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft={PlusIcon}
                            data-testid="add-output"
                            onClick={addOutput}
                            margin={{ left: 'auto' }}
                        >
                            <Translation id="RECIPIENT_ADD" />
                        </Button>
                    )}
                </Row>
            )}

            {memo?.prominence === 'optional' && isEnabled('destinationTag') && (
                <OptionalMemo memo={memo} close={() => toggle('destinationTag')} />
            )}

            {data && !isDataUnavailable && isDataEnabled && (
                <TransactionData maxBytes={data.maxBytes} close={() => toggle('transactionData')} />
            )}

            {nonceOverride && isEnabled('ethereumNonce') && (
                <NoncePanel nonceOverride={nonceOverride} onCancel={cancelNonceOverride} />
            )}

            {options.locktime && isEnabled('bitcoinLocktime') && <Locktime close={closeLocktime} />}

            {options.coinControl && isEnabled('utxoSelection') && (
                <CoinControl close={toggleUtxoSelection} />
            )}
        </Column>
    );
};
