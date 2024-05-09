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
import { BackupType } from '../../../reducers/onboarding/onboardingReducer';

export const isShamirBackupType = (type: BackupType) =>
    ['shamir-default', 'shamir-advance'].includes(type);

const typesToLabelMap: Record<BackupType, TranslationKey> = {
    'shamir-default': 'TR_ONBOARDING_SEED_TYPE_SINGLE_SEED',
    'shamir-advance': 'TR_ONBOARDING_SEED_TYPE_ADVANCED',
    '12-words': 'TR_ONBOARDING_SEED_TYPE_12_WORDS',
    '24-words': 'TR_ONBOARDING_SEED_TYPE_24_WORDS',
};

const defaultBackupTypeMap: Record<DeviceModelInternal, BackupType> = {
    [DeviceModelInternal.T1B1]: '24-words',
    [DeviceModelInternal.T2T1]: '12-words',
    [DeviceModelInternal.T2B1]: 'shamir-default',
    [DeviceModelInternal.T3T1]: 'shamir-default',
};

type GetDefaultBackupTypeParams = { model: DeviceModelInternal; packaging: number };

export const getDefaultBackupType = ({
    model,
    packaging,
}: GetDefaultBackupTypeParams): BackupType => {
    // Original package of Trezor Safe 3 have a card with just 12 words.
    if (model === DeviceModelInternal.T2B1 && packaging === 0) {
        return '12-words';
    }

    return defaultBackupTypeMap[model];
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

const OptionGroupHeading = styled.div`
    display: flex;
    flex-direction: row;
    padding: ${spacingsPx.md} ${spacingsPx.xl} 0 ${spacingsPx.xl};
    gap: ${spacingsPx.md};
    align-items: center;
`;

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
    'data-test'?: string;
};

const Option = ({ children, onSelect, isChecked, 'data-test': dataTest }: OptionProps) => (
    <OptionStyled>
        {children}
        <Radio isChecked={isChecked} onClick={onSelect} data-test={dataTest} />
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
    defaultType: BackupType;
};

const DefaultTag = () => (
    <Badge variant="primary" inline margin={{ left: spacings.xxs }}>
        <Text typographyStyle="hint">
            <Translation id="TR_ONBOARDING_BACKUP_TYPE_DEFAULT" />
        </Text>
    </Badge>
);

const FloatingSelections = forwardRef<HTMLDivElement, FloatingSelectionsProps>(
    ({ selected, onSelect, style, defaultType }, ref) => {
        const { elevation } = useElevation();

        return (
            <FloatingSelectionsWrapper $elevation={elevation} ref={ref} style={style}>
                <OptionGroupHeading>
                    <Text typographyStyle="hint" variant="tertiary">
                        <Translation id="TR_ONBOARDING_BACKUP_CATEGORY_20_WORD_BACKUPS" />
                    </Text>
                </OptionGroupHeading>
                <Option
                    onSelect={() => onSelect('shamir-default')}
                    isChecked={selected === 'shamir-default'}
                    data-test="@onboarding/select-seed-type-shamir-default"
                >
                    <OptionText>
                        <Text
                            variant={selected === 'shamir-default' ? undefined : 'tertiary'}
                            typographyStyle="titleSmall"
                        >
                            <Translation id={typesToLabelMap['shamir-default']} />
                            {defaultType === 'shamir-default' ? (
                                <DefaultTag />
                            ) : (
                                <Badge variant="tertiary" inline margin={{ left: spacings.xxs }}>
                                    <Translation id="TR_ONBOARDING_BACKUP_TYPE_UPGRADABLE_TO_MULTI" />
                                </Badge>
                            )}
                        </Text>
                        <Text typographyStyle="hint">
                            <Translation id="TR_ONBOARDING_SEED_TYPE_SINGLE_SEED_DESCRIPTION" />
                        </Text>
                    </OptionText>
                </Option>
                <Option
                    onSelect={() => onSelect('shamir-advance')}
                    isChecked={selected === 'shamir-advance'}
                    data-test="@onboarding/select-seed-type-shamir-advance"
                >
                    <OptionText>
                        <Text
                            variant={selected === 'shamir-advance' ? undefined : 'tertiary'}
                            typographyStyle="titleSmall"
                        >
                            <Translation id={typesToLabelMap['shamir-advance']} />
                            {defaultType === 'shamir-advance' && <DefaultTag />}
                            <Badge variant="tertiary" inline margin={{ left: spacings.xxs }}>
                                <Translation id="TR_ONBOARDING_BACKUP_TYPE_ADVANCED" />
                            </Badge>
                        </Text>
                        <Text typographyStyle="hint">
                            <Translation id="TR_ONBOARDING_SEED_TYPE_ADVANCED_DESCRIPTION" />
                        </Text>
                    </OptionText>
                </Option>
                <Divider />
                <OptionGroupHeading>
                    <Text typographyStyle="hint" variant="tertiary">
                        <Translation
                            id="TR_ONBOARDING_BACKUP_OLDER_BACKUP_TYPES"
                            values={{ br: () => <br /> }}
                        />
                    </Text>
                </OptionGroupHeading>
                <Option
                    onSelect={() => onSelect('12-words')}
                    isChecked={selected === '12-words'}
                    data-test="@onboarding/select-seed-type-12-words"
                >
                    <OptionText>
                        <Text
                            variant={selected === '12-words' ? undefined : 'tertiary'}
                            typographyStyle="titleSmall"
                        >
                            <Translation id={typesToLabelMap['12-words']} />
                            {defaultType === '12-words' && <DefaultTag />}
                        </Text>
                        {defaultType === '12-words' && (
                            <Text typographyStyle="hint">
                                <Translation id="TR_ONBOARDING_BACKUP_TYPE_12_WORDS_DEFAULT_NOTE" />
                            </Text>
                        )}
                    </OptionText>
                </Option>
                <Option
                    onSelect={() => onSelect('24-words')}
                    isChecked={selected === '24-words'}
                    data-test="@onboarding/select-seed-type-24-words"
                >
                    <OptionText>
                        <Text
                            variant={selected === '24-words' ? undefined : 'tertiary'}
                            typographyStyle="titleSmall"
                        >
                            <Translation id={typesToLabelMap['24-words']} />
                            {defaultType === '24-words' && <DefaultTag />}
                        </Text>
                    </OptionText>
                </Option>
            </FloatingSelectionsWrapper>
        );
    },
);

const BackupWarning = ({ id }: { id: TranslationKey }) => (
    <Warning variant="info" withIcon>
        <Translation id={id} values={{ strong: chunks => <strong>{chunks}</strong> }} />
    </Warning>
);

type SelectBackupTypeProps = {
    isDisabled: boolean;
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    'data-test'?: string;
};

export const SelectBackupType = ({
    selected,
    onSelect,
    isDisabled,
    'data-test': dataTest,
}: SelectBackupTypeProps) => {
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
        ? getDefaultBackupType({
              model: device.features.internal_model,
              packaging: device.features.unit_packaging ?? 0,
          })
        : 'shamir-default';

    const isDefault = defaultBackupType === selected;
    const isShamirDefault = isShamirBackupType(defaultBackupType);
    const isShamirSelected = isShamirBackupType(selected);

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
                        <OptionText data-test={dataTest}>
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
                                    defaultType={defaultBackupType}
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
            {!isShamirSelected && isShamirDefault && (
                <BackupWarning id="TR_ONBOARDING_BACKUP_LEGACY_WARNING" />
            )}
            {isShamirSelected && !isShamirDefault && (
                <BackupWarning id="TR_ONBOARDING_BACKUP_SHAMIR_WARNING" />
            )}
        </Wrapper>
    );
};
