import { useState } from 'react';

import {
    selectDiscoveryByDeviceState,
    selectCurrentFiatRates,
    selectDeviceThunk,
    selectDevice,
    createDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Card, Icon, Tooltip, Row, Column, Text, Divider } from '@trezor/components';
import { getAllAccounts, getTotalFiatBalance } from '@suite-common/wallet-utils';
import { spacings, negativeSpacings } from '@trezor/theme';

import {
    WalletLabeling,
    Translation,
    MetadataLabeling,
    HiddenPlaceholder,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { AcquiredDevice, ForegroundAppProps } from 'src/types/suite';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';
import { METADATA_LABELING } from 'src/actions/suite/constants';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { redirectAfterWalletSelectedThunk } from 'src/actions/wallet/addWalletThunk';

import { useWalletLabeling } from '../../../../components/suite/labeling/WalletLabeling';
import { EjectConfirmation, EjectConfirmationDisableViewOnly } from './EjectConfirmation';
import { ContentType } from '../types';
import { ViewOnly } from './ViewOnly';
import { EjectButton } from './EjectButton';

interface WalletInstanceProps {
    instance: AcquiredDevice;
    enabled: boolean;
    selected: boolean;
    index: number; // used only in data-test
    onCancel: ForegroundAppProps['onCancel'];
}

export const WalletInstance = ({
    instance,
    enabled,
    selected,
    index,
    onCancel,
    ...rest
}: WalletInstanceProps) => {
    const [contentType, setContentType] = useState<null | ContentType>('default');
    const accounts = useSelector(state => state.wallet.accounts);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);
    const editing = useSelector(state => state.metadata.editing);
    const dispatch = useDispatch();
    const discoveryProcess = useSelector(state =>
        selectDiscoveryByDeviceState(state, instance.state),
    );
    const device = useSelector(selectDevice);
    const { defaultAccountLabelString } = useWalletLabeling();

    const deviceAccounts = getAllAccounts(instance.state, accounts);
    const instanceBalance = getTotalFiatBalance({
        deviceAccounts,
        localCurrency,
        rates: currentFiatRates,
    });
    const isSelected = enabled && selected && !!discoveryProcess;
    const { walletLabel } = useSelector(state =>
        selectLabelingDataForWallet(state, instance.state),
    );
    const dataTestBase = `@switch-device/wallet-on-index/${index}`;

    const defaultWalletLabel = defaultAccountLabelString({ device: instance });

    const stopPropagation = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation();

    const onEjectCancelClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setContentType('default');
        e.stopPropagation();
    };

    const handleClick = discoveryProcess
        ? () => {
              if (!editing) {
                  dispatch(selectDeviceThunk({ device: instance }));
                  dispatch(redirectAfterWalletSelectedThunk());
                  onCancel(false);
              }
          }
        : () => {
              if (device && device.state?.staticSessionId) {
                  dispatch(
                      createDiscoveryThunk({
                          deviceState: device?.state?.staticSessionId,
                          device,
                      }),
                  );
              }
              onCancel(false);
          };

    const isViewOnlyRendered = contentType === 'default' && enabled && discoveryProcess;
    const isEjectConfirmationRendered = contentType === 'eject-confirmation';
    const isDisablingViewOnlyEjectsWalletRendered =
        contentType === 'disabling-view-only-ejects-wallet';

    return (
        <Card
            key={`${instance.instance}${instance.state}`}
            paddingType="small"
            onClick={handleClick}
            tabIndex={0}
            data-testid={dataTestBase}
            variant={isSelected ? 'primary' : undefined}
            {...rest}
        >
            <Column>
                <Text
                    as="div"
                    variant={isSelected ? 'default' : 'tertiary'}
                    typographyStyle={isSelected ? 'highlight' : 'body'}
                    ellipsisLineCount={1}
                >
                    <Row justifyContent="space-between">
                        {discoveryProcess ? (
                            <Row gap={spacings.xxs}>
                                {!instance.useEmptyPassphrase && (
                                    <Tooltip
                                        content={<Translation id="TR_WALLET_PASSPHRASE_WALLET" />}
                                    >
                                        <Icon name="asterisk" size={12} />
                                    </Tooltip>
                                )}
                                {instance.state?.staticSessionId ? (
                                    <MetadataLabeling
                                        defaultVisibleValue={
                                            walletLabel === undefined || walletLabel.trim() === ''
                                                ? defaultWalletLabel
                                                : walletLabel
                                        }
                                        payload={{
                                            type: 'walletLabel',
                                            entityKey: instance.state.staticSessionId,
                                            defaultValue: instance.state.staticSessionId,
                                            value: instance?.metadata[
                                                METADATA_LABELING.ENCRYPTION_VERSION
                                            ]
                                                ? walletLabel
                                                : '',
                                        }}
                                        defaultEditableValue={defaultWalletLabel}
                                    />
                                ) : (
                                    <WalletLabeling device={instance} />
                                )}
                            </Row>
                        ) : (
                            <Translation id="TR_UNDISCOVERED_WALLET" />
                        )}
                        <EjectButton setContentType={setContentType} data-testid={dataTestBase} />
                    </Row>
                </Text>

                <HiddenPlaceholder>
                    <FiatHeader
                        size="medium"
                        fiatAmount={instanceBalance.toString() ?? '0'}
                        localCurrency={localCurrency}
                    />
                </HiddenPlaceholder>
            </Column>

            {(isViewOnlyRendered ||
                isEjectConfirmationRendered ||
                isDisablingViewOnlyEjectsWalletRendered) && (
                <Divider
                    margin={{ vertical: spacings.sm, horizontal: negativeSpacings.sm }}
                    width="auto"
                />
            )}

            {isViewOnlyRendered && <ViewOnly setContentType={setContentType} instance={instance} />}
            {isEjectConfirmationRendered && (
                <EjectConfirmation
                    instance={instance}
                    onClick={stopPropagation}
                    onCancel={onEjectCancelClick}
                />
            )}
            {isDisablingViewOnlyEjectsWalletRendered && (
                <EjectConfirmationDisableViewOnly
                    instance={instance}
                    onClick={stopPropagation}
                    onCancel={onEjectCancelClick}
                />
            )}
        </Card>
    );
};
