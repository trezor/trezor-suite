import { PROTO } from '@trezor/connect';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn, Translation } from 'src/components/suite';
import { UNIT_LABELS, UNIT_OPTIONS } from '@suite-common/suite-constants';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

export const BitcoinAmountUnit = () => {
    const { bitcoinAmountUnit, setBitcoinAmountUnits } = useBitcoinAmountUnit();

    const handleUnitsChange = ({ value }: { value: PROTO.AmountUnit }) =>
        setBitcoinAmountUnits(value);

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.BitcoinAmountUnit}>
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
                    data-testid="@settings/btc-units-select"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
