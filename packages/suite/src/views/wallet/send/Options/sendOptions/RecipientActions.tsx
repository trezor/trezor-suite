import { Translation } from '@suite/intl';
import { Button, Row, Tooltip } from '@trezor/components';
import { CircleDashedIcon, PlusIcon } from '@trezor/icons';
import type { Recipients } from '@trezor/network-module-suite-common-types';

import { OpenGuideFromTooltip } from '#src/components/guide';
import { useSendFormContext } from '#src/hooks/wallet';

import { sendOptionFields } from './sendFormFields';
import { useCoinSelectionToggle } from './useCoinSelectionToggle';
import { useSendOption } from './useSendOption';
import { OnOffSwitcher } from '../OnOffSwitcher';

type RecipientActionsProps = {
    recipients: Recipients | undefined;
    hasCoinSelection: boolean;
};

/** Adding a recipient and opening coin control, for networks that offer them. */
export const RecipientActions = ({ recipients, hasCoinSelection }: RecipientActionsProps) => {
    const {
        addOutput,
        utxoSelection: { isCoinControlEnabled },
    } = useSendFormContext();
    const coinSelection = useSendOption(sendOptionFields.coinSelection.option);
    const toggleCoinSelection = useCoinSelectionToggle();

    const showCoinSelection = hasCoinSelection && !coinSelection.isEnabled;

    if (!showCoinSelection && recipients === undefined) {
        return null;
    }

    return (
        <Row justifyContent="space-between">
            {showCoinSelection && (
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
                        onClick={toggleCoinSelection}
                        data-testid="coin-control-button"
                    >
                        <Row>
                            <Translation id="TR_COIN_CONTROL" />
                            {isCoinControlEnabled && <OnOffSwitcher isOn />}
                        </Row>
                    </Button>
                </Tooltip>
            )}

            {recipients && (
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
    );
};
