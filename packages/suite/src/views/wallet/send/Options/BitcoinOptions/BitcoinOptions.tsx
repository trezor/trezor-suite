import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Button, Column, Row, Tooltip } from '@trezor/components';
import { CircleDashedIcon, PlusIcon } from '@trezor/icons';

import { OpenGuideFromTooltip } from 'src/components/guide';
import { useSendFormContext } from 'src/hooks/wallet';

import { OnOffSwitcher } from '../OnOffSwitcher';
import { CoinControl } from './CoinControl/CoinControl';
import { Locktime } from './Locktime/Locktime';

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
    } = useSendFormContext();

    const options = useWatch({
        name: 'options',
        defaultValue: getDefaultValue('options', []),
        control,
    });

    const locktimeEnabled = options.includes('bitcoinLocktime');
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

    return (
        <Column gap={16}>
            <Row justifyContent="space-between">
                {!utxoSelectionEnabled && (
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
            </Row>

            {locktimeEnabled && (
                <Locktime
                    close={() => {
                        resetDefaultValue('bitcoinLocktimeBlockHeight');
                        resetDefaultValue('bitcoinLocktimeDatetime');
                        // close additional form
                        if (!broadcastEnabled) toggleOption('broadcast');
                        toggleOption('bitcoinLocktime');
                        composeTransaction();
                    }}
                />
            )}

            {utxoSelectionEnabled && <CoinControl close={toggleUtxoSelection} />}
        </Column>
    );
};
