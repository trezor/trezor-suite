import styled, { css, useTheme } from 'styled-components';

import {
    toggleRememberDevice,
    deviceActions,
    selectDiscoveryByDeviceState,
    selectFiatRates,
} from '@suite-common/wallet-core';
import { useFormatters } from '@suite-common/formatters';
import {
    Switch,
    Icon,
    variables,
    Card,
    Text,
    Divider,
    CollapsibleBox,
    Radio,
} from '@trezor/components';
import { getAllAccounts, getTotalFiatBalance } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import { spacingsPx, typography } from '@trezor/theme';

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
import { FiatHeader } from 'src/views/dashboard/components/FiatHeader';
import { useState } from 'react';
import { ViewOnlyRadios } from './ViewOnlyRadios';

const InstanceType = styled.div<{ isSelected: boolean }>`
    display: flex;
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

const EjectContainer = styled.div`
    position: absolute;
    right: ${spacingsPx.sm};
    top: ${spacingsPx.sm};
`;

const Circle = styled.div<{ $isHighlighted?: boolean }>`
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: ${({ $isHighlighted, theme }) =>
        $isHighlighted ? theme.iconPrimaryDefault : theme.iconSubdued};
`;

const ViewOnlyContainer = styled.div`
    margin: -16px -12px -12px -8px;
`;
const ViewOnlyContent = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};
    align-items: center;
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
            background: ${theme.backgroundPrimaryDefault};
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
    const [isViewOnlyExpanded, setIsViewOnlyExpanded] = useState(false);
    const accounts = useSelector(state => state.wallet.accounts);
    const rates = useSelector(selectFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);
    const editing = useSelector(state => state.metadata.editing);
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

    const handleRememberChange = (value: boolean) => {
        setIsViewOnlyExpanded(false);

        return dispatch(
            toggleRememberDevice({
                device: instance,
                forceRemember: value === true ? true : undefined,
            }),
        );
    };
    const handleEject = () => {
        dispatch(deviceActions.forgetDevice(instance));
        analytics.report({
            type: EventType.SwitchDeviceEject,
        });
    };

    const defaultWalletLabel = defaultAccountLabelString({ device: instance });

    const isViewOnly = !!instance.remember;

    return (
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

            {enabled && discoveryProcess && (
                <>
                    <Divider />
                    <ViewOnlyContainer
                        onClick={e => {
                            // setIsViewOnlyExpanded(!isViewOnlyExpanded);
                            e.stopPropagation();
                        }}
                    >
                        <CollapsibleBox
                            variant="small"
                            filled="none"
                            isOpen={isViewOnlyExpanded}
                            onCollapse={() => setIsViewOnlyExpanded(true)}
                            heading={
                                <ViewOnlyContent>
                                    <Circle $isHighlighted={isViewOnly} />
                                    <Text
                                        variant={isViewOnly ? 'primary' : 'tertiary'}
                                        typographyStyle="callout"
                                    >
                                        {isViewOnly ? (
                                            <Translation id="TR_VIEW_ONLY_ENABLED" />
                                        ) : (
                                            <Translation id="TR_VIEW_ONLY_DISABLED" />
                                        )}
                                    </Text>
                                </ViewOnlyContent>
                            }
                        >
                            {/* <Switch
                                isChecked={isViewOnly}
                                onChange={handleRememberChange}
                                dataTest={`${dataTestBase}/toggle-remember-switch`}
                            /> */}
                            <ViewOnlyRadios
                                isViewOnlyActive={isViewOnly}
                                setIsViewOnlyActive={handleRememberChange}
                            />
                        </CollapsibleBox>
                    </ViewOnlyContainer>

                    <EjectContainer>
                        <Icon
                            data-test={`${dataTestBase}/eject-button`}
                            icon="EJECT"
                            size={22}
                            color={theme.TYPE_LIGHT_GREY}
                            hoverColor={theme.TYPE_DARK_GREY}
                            onClick={handleEject}
                        />
                    </EjectContainer>
                </>
            )}
        </Card>
    );
};
