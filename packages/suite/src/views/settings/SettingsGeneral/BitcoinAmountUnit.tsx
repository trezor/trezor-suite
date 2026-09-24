import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { UNIT_LABELS, UNIT_OPTIONS } from '@suite-common/suite-constants';
import { type PROTO } from '@trezor/connect';
import { SectionItem } from '@trezor/product-components';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

export const BitcoinAmountUnit = () => {
    const { bitcoinAmountUnit, setBitcoinAmountUnits } = useBitcoinAmountUnit();

    const handleUnitsChange = ({ value }: { value: PROTO.AmountUnit }) =>
        setBitcoinAmountUnits(value);

    return (
        <Anchor anchorId={SettingsAnchor.BitcoinAmountUnit}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_BTC_UNITS" />}
                    actions={
                        <SectionItem.Select
                            value={{
                                label: UNIT_LABELS[
                                    bitcoinAmountUnit as
                                        PROTO.AmountUnit.BITCOIN | PROTO.AmountUnit.SATOSHI
                                ],

                                value: bitcoinAmountUnit,
                            }}
                            options={UNIT_OPTIONS}
                            onChange={handleUnitsChange}
                            data-testid="@settings/btc-units-select"
                        />
                    }
                />
            )}
        </Anchor>
    );
};
