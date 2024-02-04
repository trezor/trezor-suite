import styled from 'styled-components';
import { useState } from 'react';
import { CoinLogo, H2 } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Account } from '@suite-common/wallet-types';
import { desktopApi } from '@trezor/suite-desktop-api';
import { TranslationKey } from '@suite-common/intl-types';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setDebugMode } from 'src/actions/suite/suiteActions';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { AccountLabel, useAccountLabel } from 'src/components/suite/AccountLabel';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { MetadataLabeling } from 'src/components/suite/labeling';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { FiatValue } from 'src/components/suite/FiatValue';

const Heading = styled(H2)`
    display: flex;
    align-items: center;
`;

interface BasicNameProps {
    nameId: TranslationKey;
}

const BasicName = ({ nameId }: BasicNameProps) => (
    <Heading>
        <Translation id={nameId} />
    </Heading>
);

const SettingsName = ({ nameId }: BasicNameProps) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    // show debug menu item after 5 clicks on "Settings" heading
    const [clickCounter, setClickCounter] = useState<number>(0);

    const dispatch = useDispatch();

    const handleTitleClick = () => {
        setClickCounter(prev => prev + 1);

        if (clickCounter === 4) {
            setClickCounter(0);
            dispatch(setDebugMode({ showDebugMenu: !isDebugModeActive }));

            if (desktopApi.available) {
                desktopApi.configLogger(
                    isDebugModeActive
                        ? {} // Reset to default values.
                        : {
                              level: 'debug',
                              options: {
                                  writeToDisk: true,
                              },
                          },
                );
            }
        }
    };

    return (
        <Heading onClick={handleTitleClick}>
            <Translation id={nameId} />
        </Heading>
    );
};

interface AccountNameProps {
    selectedAccount: Account;
}

const AccountName = ({ selectedAccount }: AccountNameProps) => {
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);

    const { defaultAccountLabelString } = useAccountLabel();

    const { symbol, key, path, index, accountType } = selectedAccount;

    return (
        <Heading>
            <MetadataLabeling
                defaultVisibleValue={
                    <AccountLabel
                        accountLabel={selectedAccountLabels.accountLabel}
                        accountType={accountType}
                        symbol={selectedAccount.symbol}
                        index={index}
                    />
                }
                payload={{
                    type: 'accountLabel',
                    entityKey: key,
                    defaultValue: path,
                    value: selectedAccountLabels.accountLabel,
                }}
                defaultEditableValue={defaultAccountLabelString({ accountType, symbol, index })}
            />
        </Heading>
    );
};

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

const AccountBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.sm};
    color: ${({ theme }) => theme.textSubdued};
`;

const CryptoBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

const AccountDetails = ({ selectedAccount }: AccountNameProps) => {
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);

    const { defaultAccountLabelString } = useAccountLabel();

    const { symbol, key, path, index, accountType, formattedBalance } = selectedAccount;

    return (
        <DetailsContainer>
            <MetadataLabeling
                defaultVisibleValue={
                    <AccountLabel
                        accountLabel={selectedAccountLabels.accountLabel}
                        accountType={accountType}
                        symbol={selectedAccount.symbol}
                        index={index}
                    />
                }
                payload={{
                    type: 'accountLabel',
                    entityKey: key,
                    defaultValue: path,
                    value: selectedAccountLabels.accountLabel,
                }}
                defaultEditableValue={defaultAccountLabelString({ accountType, symbol, index })}
            />

            <AccountBalance>
                <CryptoBalance>
                    <CoinLogo size={16} symbol={symbol} />
                    <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                </CryptoBalance>

                <span>
                    ~<FiatValue amount={formattedBalance} symbol={symbol} />
                </span>
            </AccountBalance>
        </DetailsContainer>
    );
};

export const PageName = () => {
    const currentRoute = useSelector(state => state.router.route?.name);
    const selectedAccount = useSelector(state => selectSelectedAccount(state));

    // TODO: does not work with foreground apps, e.g. FW update
    if (currentRoute?.includes('settings')) {
        return <SettingsName nameId="TR_SETTINGS" />;
    }

    if (selectedAccount) {
        return <AccountDetails selectedAccount={selectedAccount} />;
    }

    return (
        <Heading>
            <BasicName nameId="TR_DASHBOARD" />
        </Heading>
    );
};
