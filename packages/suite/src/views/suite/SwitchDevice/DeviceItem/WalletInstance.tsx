import styled, { css } from 'styled-components';

import { selectDiscoveryByDeviceState, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { variables, Card, Divider, Icon, Tooltip } from '@trezor/components';
import { getAllAccounts, getTotalFiatBalance } from '@suite-common/wallet-utils';
import { spacingsPx, typography } from '@trezor/theme';

import {
    WalletLabeling,
    Translation,
    MetadataLabeling,
    HiddenPlaceholder,
} from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { TrezorDevice, AcquiredDevice } from 'src/types/suite';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';
import { useWalletLabeling } from '../../../../components/suite/labeling/WalletLabeling';
import { METADATA_LABELING } from 'src/actions/suite/constants';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { FiatHeader } from 'src/views/dashboard/components/FiatHeader';
import { useState } from 'react';
import { EjectConfirmation, EjectConfirmationDisableViewOnly } from './EjectConfirmation';
import { ContentType } from '../types';
import { ViewOnly } from './ViewOnly';
import { EjectButton } from './EjectButton';

const RelativeContainer = styled.div`
    position: relative;
    border-radius: 16px;
    overflow: hidden;
`;

const DividerWrapper = styled.div`
    position: relative;
    left: -${spacingsPx.xs};
    width: calc(100% + ${spacingsPx.lg});
`;

const InstanceType = styled.div<{ isSelected: boolean }>`
    display: flex;
    gap: ${spacingsPx.xxs};
    align-items: center;
    color: ${({ theme, isSelected }) => (isSelected ? theme.textDefault : theme.textSubdued)};
    ${({ isSelected }) => isSelected && typography.highlight}
    /* these styles ensure proper metadata behavior */
    white-space: nowrap;
    overflow: hidden;
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

const SelectedHighlight = styled.div`
    ${({ theme }) => css`
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: ${spacingsPx.xxs};
            background: ${theme.backgroundSecondaryDefault};
        }
    `}
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
    const [contentType, setContentType] = useState<null | ContentType>('default');
    const accounts = useSelector(state => state.wallet.accounts);
    const currentRiatRates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);
    const editing = useSelector(state => state.metadata.editing);

    const discoveryProcess = useSelector(state =>
        selectDiscoveryByDeviceState(state, instance.state),
    );
    const { defaultAccountLabelString } = useWalletLabeling();

    const deviceAccounts = getAllAccounts(instance.state, accounts);
    const instanceBalance = getTotalFiatBalance(deviceAccounts, localCurrency, currentRiatRates);
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

    return (
        <RelativeContainer>
            <EjectButton setContentType={setContentType} dataTest={dataTestBase} />
            <Card
                data-test={dataTestBase}
                key={`${instance.label}${instance.instance}${instance.state}`}
                paddingType="small"
                onClick={() => !editing && selectDeviceInstance(instance)}
                tabIndex={0}
                {...rest}
            >
                {isSelected && <SelectedHighlight />}

                <Col $grow={1}>
                    {discoveryProcess && (
                        <InstanceType isSelected={isSelected}>
                            {!instance.useEmptyPassphrase && (
                                <Tooltip content={<Translation id="TR_WALLET_PASSPHRASE_WALLET" />}>
                                    <Icon icon="ASTERISK" color="textDefault" size={12} />
                                </Tooltip>
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
                        </InstanceType>
                    )}

                    {!discoveryProcess && (
                        <InstanceType isSelected={isSelected}>
                            <Translation id="TR_UNDISCOVERED_WALLET" />
                        </InstanceType>
                    )}

                    <InstanceTitle>
                        <HiddenPlaceholder>
                            <FiatHeader
                                size="medium"
                                fiatAmount={instanceBalance.toString() ?? '0'}
                                localCurrency={localCurrency}
                            />
                        </HiddenPlaceholder>
                    </InstanceTitle>
                </Col>

                <DividerWrapper>
                    <Divider />
                </DividerWrapper>

                {contentType === 'default' && enabled && discoveryProcess && (
                    <ViewOnly
                        dataTest={dataTestBase}
                        setContentType={setContentType}
                        instance={instance}
                    />
                )}
                {contentType === 'ejectConfirmation' && (
                    <EjectConfirmation
                        instance={instance}
                        onClick={stopPropagation}
                        onCancel={onEjectCancelClick}
                    />
                )}
                {contentType === 'disabling-view-only-ejects-wallet' && (
                    <EjectConfirmationDisableViewOnly
                        instance={instance}
                        onClick={stopPropagation}
                        onCancel={onEjectCancelClick}
                    />
                )}
            </Card>
        </RelativeContainer>
    );
};
