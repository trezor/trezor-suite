import {
    Badge,
    Divider,
    ElevationUp,
    Icon,
    Radio,
    Text,
    Warning,
    useElevation,
} from '@trezor/components';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacings,
    spacingsPx,
    zIndices,
} from '@trezor/theme';
import { CSSProperties, ReactNode, forwardRef, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from '../../../hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/connect';
import {
    FloatingFocusManager,
    autoUpdate,
    useFloating,
    useClick,
    useDismiss,
    useRole,
    useInteractions,
    FloatingPortal,
    size,
    offset,
} from '@floating-ui/react';
import { TranslationKey } from '@suite-common/intl-types';
import { Translation } from '../../../components/suite';

export const selectBackupTypes = [
    'shamir-default',
    'shamir-advance',
    '12-words',
    '24-words',
] as const;

export type BackupType = (typeof selectBackupTypes)[number];

const isDeviceLegacyMap: Record<DeviceModelInternal, boolean> = {
    [DeviceModelInternal.T1B1]: true,
    [DeviceModelInternal.T2T1]: true,
    [DeviceModelInternal.T2B1]: false,
    [DeviceModelInternal.T3T1]: false
};

const isLegacyDevice = (model?: DeviceModelInternal) =>
    model !== undefined && isDeviceLegacyMap[model];

export const isShamirBackupType = (type: BackupType) =>
    ['shamir-default', 'shamir-advance'].includes(type);

const typesToLabelMap: Record<BackupType, TranslationKey> = {
    'shamir-default': 'TR_ONBOARDING_SEED_TYPE_SINGLE_SEED',
    'shamir-advance': 'TR_ONBOARDING_SEED_TYPE_ADVANCED',
    '12-words': 'TR_ONBOARDING_SEED_TYPE_12_WORDS',
    '24-words': 'TR_ONBOARDING_SEED_TYPE_24_WORDS',
};

export const defaultBackupTypeMap: Record<DeviceModelInternal, BackupType> = {
    [DeviceModelInternal.T1B1]: '24-words',
    [DeviceModelInternal.T2T1]: '12-words',
    [DeviceModelInternal.T2B1]: 'shamir-default',
    [DeviceModelInternal.T3T1]: 'shamir-default'
};

const SELECT_ELEMENT_HEIGHT = 84;

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xl};
`;

const SelectWrapper = styled.div<{ $elevation: Elevation }>`
    width: 100%;
    border-radius: ${borders.radii.sm};
    border: 1px solid ${mapElevationToBorder};
    background: ${mapElevationToBackground};
    height: ${SELECT_ELEMENT_HEIGHT}px;
    position: relative;
`;

const OptionText = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
`;

const DownIconCircle = styled.div<{ $elevation: Elevation }>`
    border-radius: ${borders.radii.full};
    border: 1px solid ${mapElevationToBorder};
    background: ${mapElevationToBackground};
    height: 36px;
    width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
`;

const BackupIconWrapper = styled.div``;

const OptionStyled = styled.div`
    display: flex;
    flex-direction: row;
    padding: ${spacingsPx.md} ${spacingsPx.xl};
    gap: ${spacingsPx.md};
    align-items: center;
`;

const DownComponent = () => {
    const { elevation } = useElevation();

    return (
        <DownIconCircle $elevation={elevation}>
            <Icon icon="ARROW_DOWN" size={16} />
        </DownIconCircle>
    );
};

type SelectedOptionProps = { children: ReactNode; onClick: () => void; isDisabled: boolean };

const SelectedOptionStyled = styled.div<{ $isDisabled: boolean }>`
    cursor: ${({ $isDisabled }) => ($isDisabled ? undefined : 'pointer')};
`;

const SelectedOption = forwardRef<HTMLDivElement, SelectedOptionProps>(
    ({ children, onClick, isDisabled }, ref) => (
        <SelectedOptionStyled $isDisabled={isDisabled}>
            <OptionStyled ref={ref} onClick={isDisabled ? undefined : onClick}>
                <BackupIconWrapper>
                    <Icon icon="BACKUP" size={24} />
                </BackupIconWrapper>
                {children}
                <DownComponent />
            </OptionStyled>
        </SelectedOptionStyled>
    ),
);

type OptionProps = {
    children: ReactNode;
    onSelect: () => void;
    isChecked: boolean;
};

const Option = ({ children, onSelect, isChecked }: OptionProps) => (
    <OptionStyled>
        {children}
        <Radio isChecked={isChecked} onClick={onSelect} />
    </OptionStyled>
);

const FloatingSelectionsWrapper = styled.div<{ $elevation: Elevation }>`
    z-index: ${zIndices.modal};
    border-radius: ${borders.radii.sm};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    background: ${mapElevationToBackground};
`;

type FloatingSelectionsProps = {
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    style: CSSProperties;
};

const FloatingSelections = forwardRef<HTMLDivElement, FloatingSelectionsProps>(
    ({ selected, onSelect, style }, ref) => {
        const { elevation } = useElevation();

        return (
            <FloatingSelectionsWrapper $elevation={elevation} ref={ref} style={style}>
                <Option
                    onSelect={() => onSelect('shamir-default')}
                    isChecked={selected === 'shamir-default'}
                >
                    <OptionText>
                        <Text variant="tertiary" typographyStyle="titleSmall">
                            <Translation id={typesToLabelMap['shamir-default']} />
                            <Badge variant="primary" inline margin={{ left: spacings.xxs }}>
                                <Text typographyStyle="hint">
                                    <Translation id="TR_ONBOARDING_BACKUP_TYPE_DEFAULT" />
                                </Text>
                            </Badge>
                        </Text>
                        <Text typographyStyle="hint">
                            <Translation id="TR_ONBOARDING_SEED_TYPE_SINGLE_SEED_DESCRIPTION" />
                        </Text>
                    </OptionText>
                </Option>
                <Option
                    onSelect={() => onSelect('shamir-advance')}
                    isChecked={selected === 'shamir-advance'}
                >
                    <OptionText>
                        <Text variant={'tertiary'} typographyStyle="titleSmall">
                            <Translation id={typesToLabelMap['shamir-advance']} />
                            <Badge variant="tertiary" inline margin={{ left: spacings.xxs }}>
                                <Translation id="TR_ONBOARDING_BACKUP_TYPE_ADVANCED" />
                            </Badge>
                        </Text>
                        <Text typographyStyle="hint">
                            <Translation id="TR_ONBOARDING_SEED_TYPE_SINGLE_SEED_DESCRIPTION" />
                        </Text>
                    </OptionText>
                </Option>
                <Divider />
                <OptionStyled>
                    <Text typographyStyle="hint">
                        <Translation
                            id="TR_ONBOARDING_BACKUP_OLDER_BACKUP_TYPES"
                            values={{ br: () => <br /> }}
                        />
                    </Text>
                </OptionStyled>
                <Option onSelect={() => onSelect('12-words')} isChecked={selected === '12-words'}>
                    <OptionText>
                        <Text variant={'tertiary'} typographyStyle="titleSmall">
                            <Translation id={typesToLabelMap['12-words']} />
                        </Text>
                    </OptionText>
                </Option>
                <Option onSelect={() => onSelect('24-words')} isChecked={selected === '24-words'}>
                    <OptionText>
                        <Text variant={'tertiary'} typographyStyle="titleSmall">
                            <Translation id={typesToLabelMap['24-words']} />
                        </Text>
                    </OptionText>
                </Option>
            </FloatingSelectionsWrapper>
        );
    },
);

const LegacyWarning = () => {
    return (
        <Warning variant="info" withIcon>
            <Translation id="TR_ONBOARDING_BACKUP_LEGACY_WARNING" />
        </Warning>
    );
};

type SelectBackupTypeProps = {
    isDisabled: boolean;
    selected: BackupType;
    onSelect: (value: BackupType) => void;
};

export const SelectBackupType = ({ selected, onSelect, isDisabled }: SelectBackupTypeProps) => {
    const { elevation } = useElevation();
    const [isOpen, setIsOpen] = useState(false);
    const device = useSelector(selectDevice);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(-SELECT_ELEMENT_HEIGHT),
            size({
                apply({ rects, elements }) {
                    Object.assign(elements.floating.style, {
                        width: `${rects.reference.width}px`,
                    });
                },
                padding: 10,
            }),
        ],
        whileElementsMounted: autoUpdate,
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

    const defaultBackupType: BackupType = device?.features?.internal_model
        ? defaultBackupTypeMap[device.features.internal_model]
        : 'shamir-default';

    // We want to show user the 12-words because its default for this device,
    // and we want to show user this explicit information, not just default as it is
    // for newer devices.
    const isModelT = device?.features?.internal_model === DeviceModelInternal.T2T1;

    const isDefault = defaultBackupType === selected && !isModelT;
    const isShamirSelected = isShamirBackupType(selected);
    const isLegacyModel = isLegacyDevice(device?.features?.internal_model);

    return (
        <Wrapper>
            <SelectWrapper $elevation={elevation}>
                <ElevationUp>
                    <SelectedOption
                        isDisabled={isDisabled}
                        onClick={() => setIsOpen(true)}
                        ref={refs.setReference}
                        {...getReferenceProps()}
                    >
                        <OptionText>
                            <Text variant="tertiary" typographyStyle="hint">
                                <Translation id="TR_ONBOARDING_BACKUP_TYPE" />
                            </Text>
                            <Text typographyStyle="titleSmall">
                                <Translation
                                    id={
                                        isDefault
                                            ? 'TR_ONBOARDING_BACKUP_TYPE_DEFAULT'
                                            : typesToLabelMap[selected]
                                    }
                                />
                            </Text>
                        </OptionText>
                    </SelectedOption>
                    {isOpen && (
                        <FloatingPortal>
                            <FloatingFocusManager context={context} modal={false}>
                                <FloatingSelections
                                    ref={refs.setFloating}
                                    style={floatingStyles}
                                    {...getFloatingProps()}
                                    selected={selected}
                                    onSelect={value => {
                                        setIsOpen(false);
                                        onSelect(value);
                                    }}
                                />
                            </FloatingFocusManager>
                        </FloatingPortal>
                    )}
                </ElevationUp>
            </SelectWrapper>
            {!isShamirSelected && !isLegacyModel && <LegacyWarning />}
        </Wrapper>
    );
};
