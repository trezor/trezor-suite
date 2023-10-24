import { analytics, EventType } from '@trezor/suite-analytics';
import { FiatCurrencyCode, fiatCurrencies } from '@suite-common/suite-config';

import {
    ActionColumn,
    ActionSelect,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setLocalCurrency } from 'src/actions/settings/walletSettingsActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const buildCurrencyOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

export const Fiat = () => {
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Fiat);

    const options = Object.keys(fiatCurrencies).map(c => buildCurrencyOption(c));
    const value = buildCurrencyOption(localCurrency);

    const handleChange = (option: { value: FiatCurrencyCode; label: string }) => {
        dispatch(setLocalCurrency(option.value));
        analytics.report({
            type: EventType.SettingsGeneralChangeFiat,
            payload: {
                fiat: option.value,
            },
        });
    };

    return (
        <SectionItem data-test="@settings/fiat" ref={anchorRef} shouldHighlight={shouldHighlight}>
            <TextColumn title={<Translation id="TR_PRIMARY_FIAT" />} />
            <ActionColumn>
                <ActionSelect
                    hideTextCursor
                    useKeyPressScroll
                    onChange={handleChange}
                    value={value}
                    options={options}
                    data-test="@settings/fiat-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
