import React from 'react';
import { PROTO } from '@trezor/connect';

import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { Translation } from 'src/components/suite/Translation';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { UNIT_LABELS, UNIT_OPTIONS } from '@suite-common/suite-constants';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

export const BitcoinAmountUnit = () => {
    const { bitcoinAmountUnit, setBitcoinAmountUnits } = useBitcoinAmountUnit();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.BitcoinAmountUnit);

    const handleUnitsChange = ({ value }: { value: PROTO.AmountUnit }) =>
        setBitcoinAmountUnits(value);

    return (
        <SectionItem
            data-test="@settings/btc-units"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn title={<Translation id="TR_BTC_UNITS" />} />
            <ActionColumn>
                <ActionSelect
                    hideTextCursor
                    useKeyPressScroll
                    value={{
                        label: UNIT_LABELS[
                            bitcoinAmountUnit as PROTO.AmountUnit.BITCOIN | PROTO.AmountUnit.SATOSHI
                        ],
                        value: bitcoinAmountUnit,
                    }}
                    options={UNIT_OPTIONS}
                    onChange={handleUnitsChange}
                    data-test="@settings/btc-units-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
