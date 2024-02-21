import { PROTO } from '@trezor/connect';

import {
    ActionColumn,
    ActionSelect,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
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
            data-test-id="@settings/btc-units"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn title={<Translation id="TR_BTC_UNITS" />} />
            <ActionColumn>
                <ActionSelect
                    useKeyPressScroll
                    value={{
                        label: UNIT_LABELS[
                            bitcoinAmountUnit as PROTO.AmountUnit.BITCOIN | PROTO.AmountUnit.SATOSHI
                        ],
                        value: bitcoinAmountUnit,
                    }}
                    options={UNIT_OPTIONS}
                    onChange={handleUnitsChange}
                    data-test-id="@settings/btc-units-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
