import styled, { useTheme } from 'styled-components';

import {
    toggleRememberDevice,
    deviceActions,
    selectDiscoveryByDeviceState,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { useFormatters } from '@suite-common/formatters';
import { Switch, Box, Icon, variables } from '@trezor/components';
import { getAllAccounts, getTotalFiatBalance } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import { spacingsPx } from '@trezor/theme';

import {
    WalletLabeling,
    Translation,
    MetadataLabeling,
    HiddenPlaceholder,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { TrezorDevice, AcquiredDevice } from 'src/types/suite';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';
import { useWalletLabeling } from '../../../../components/suite/labeling/WalletLabeling';
import { METADATA_LABELING } from 'src/actions/suite/constants';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectSuiteSettings } from '../../../../reducers/suite/suiteReducer';

const InstanceType = styled.div`
    display: flex;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    line-height: 1.5;
    align-items: center;

    /* these styles ensure proper metadata behavior */
    white-space: nowrap;
    overflow: hidden;
    max-width: 300px;
`;

const InstanceTitle = styled.div`
    font-weight: 500;
    line-height: 1.57;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-variant-numeric: tabular-nums;
`;

const Col = styled.div<{ $grow?: number; $centerItems?: boolean }>`
    display: flex;
    flex-grow: ${({ $grow }) => $grow || 0};
    flex-direction: column;
    align-items: ${({ $centerItems }) => ($centerItems ? 'center' : 'flex-start')};

    &:first-child {
        cursor: pointer;
    }
`;

const ColEject = styled(Col)`
    margin-left: ${spacingsPx.xxxl};
    margin-right: ${spacingsPx.sm};
`;

const SwitchCol = styled.div`
    display: flex;
`;

const LockIcon = styled(Icon)`
    margin-right: 4px;
`;
interface WalletInstanceProps {
    instance: AcquiredDevice;
    enabled: boolean;
    selected: boolean;
    selectDeviceInstance: (instance: TrezorDevice) => void;
    index: number; // used only in data-test
}

export const WalletInstance = ({
    instance,
    enabled,
    selected,
    selectDeviceInstance,
    index,
    ...rest
}: WalletInstanceProps) => {
    const accounts = useSelector(state => state.wallet.accounts);
    const rates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);
    const editing = useSelector(state => state.metadata.editing);
    const settings = useSelector(selectSuiteSettings);

    const dispatch = useDispatch();

    const { FiatAmountFormatter } = useFormatters();
    const theme = useTheme();

    const discoveryProcess = useSelector(state =>
        selectDiscoveryByDeviceState(state, instance.state),
    );
    const { defaultAccountLabelString } = useWalletLabeling();

    const deviceAccounts = getAllAccounts(instance.state, accounts);
    const accountsCount = deviceAccounts.length;
    const instanceBalance = getTotalFiatBalance(deviceAccounts, localCurrency, rates);
    const isSelected = enabled && selected && !!discoveryProcess;
    const { walletLabel } = useSelector(state =>
        selectLabelingDataForWallet(state, instance.state),
    );
    const dataTestBase = `@switch-device/wallet-on-index/${index}`;

    const handleRememberChange = () => dispatch(toggleRememberDevice({ device: instance }));
    const handleEject = () => {
        dispatch(deviceActions.forgetDevice({ device: instance, settings }));
        analytics.report({
            type: EventType.SwitchDeviceEject,
        });
    };

    const defaultWalletLabel = defaultAccountLabelString({ device: instance });

    return (
        <Box
            forceElevation={0} // @TODO delete when Checkbox has different background in dark mode
            data-test={dataTestBase}
            key={`${instance.label}${instance.instance}${instance.state}`}
            variant={isSelected ? 'primary' : undefined}
            {...rest}
        >
            <Col $grow={1} onClick={() => !editing && selectDeviceInstance(instance)} tabIndex={0}>
                {discoveryProcess && (
                    <InstanceType>
                        {!instance.useEmptyPassphrase && (
                            <LockIcon icon="LOCK_ACTIVE" color={theme.TYPE_DARK_GREY} size={12} />
                        )}
                        {instance.state ? (
                            <MetadataLabeling
                                defaultVisibleValue={
                                    walletLabel === undefined || walletLabel.trim() === ''
                                        ? defaultWalletLabel
                                        : walletLabel
                                }
                                payload={{
                                    type: 'walletLabel',
                                    entityKey: instance.state,
                                    defaultValue: instance.state,
                                    value: instance?.metadata[METADATA_LABELING.ENCRYPTION_VERSION]
                                        ? walletLabel
                                        : '',
                                }}
                                defaultEditableValue={defaultWalletLabel}
                            />
                        ) : (
                            <WalletLabeling device={instance} />
                        )}
                    </InstanceType>
                )}

                {!discoveryProcess && (
                    <InstanceType>
                        <Translation id="TR_UNDISCOVERED_WALLET" />
                    </InstanceType>
                )}

                <InstanceTitle>
                    <Translation
                        id="TR_NUM_ACCOUNTS_FIAT_VALUE"
                        values={{
                            accountsCount,
                            fiatValue: (
                                <HiddenPlaceholder>
                                    <FiatAmountFormatter
                                        value={instanceBalance.toString()}
                                        currency={localCurrency}
                                    />
                                </HiddenPlaceholder>
                            ),
                        }}
                    />
                </InstanceTitle>
            </Col>

            {enabled && discoveryProcess && (
                <>
                    <SwitchCol>
                        <Switch
                            isChecked={!!instance.remember}
                            onChange={handleRememberChange}
                            dataTest={`${dataTestBase}/toggle-remember-switch`}
                        />
                    </SwitchCol>

                    <ColEject $centerItems>
                        <Icon
                            data-test={`${dataTestBase}/eject-button`}
                            icon="EJECT"
                            size={22}
                            color={theme.TYPE_LIGHT_GREY}
                            hoverColor={theme.TYPE_DARK_GREY}
                            onClick={handleEject}
                        />
                    </ColEject>
                </>
            )}
        </Box>
    );
};
