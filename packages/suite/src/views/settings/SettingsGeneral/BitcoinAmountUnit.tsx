import { Translation } from '@suite/intl';
import { UNIT_LABELS, UNIT_OPTIONS } from '@suite-common/suite-constants';
import { PROTO } from '@trezor/connect';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';
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
