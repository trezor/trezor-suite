import {
    Badge,
    Divider,
    ElevationUp,
    Icon,
    Radio,
    Text,
    Warning,
    useElevation,
    variables,
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
import { useLayoutSize, useSelector } from '../../../hooks/suite';
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
const SELECT_ELEMENT_HEIGHT_MOBILE = 62;

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

    /* IMPORTANT: 
        When changing anything that causes change in height, 
        make sure you put correct number into size() 
        middleware of the Floating UI
    */

    height: ${SELECT_ELEMENT_HEIGHT}px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        height: ${SELECT_ELEMENT_HEIGHT_MOBILE}px;
    }

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

    gap: ${spacingsPx.md};
    align-items: center;
`;

const OptionStyled = styled.div`
    display: flex;
    flex-direction: row;

    gap: ${spacingsPx.md};
    align-items: center;
    cursor: pointer;
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

    /* IMPORTANT: 
        When changing anything that causes change in height, 
        make sure you put correct number into size() 
        middleware of the Floating UI.
    */

    padding: ${spacingsPx.md} ${spacingsPx.xl};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: ${spacingsPx.xs} ${spacingsPx.sm} ${spacingsPx.md} ${spacingsPx.sm};
    }
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
    <OptionStyled onClick={onSelect}>
        {children}
        <Radio isChecked={isChecked} onClick={onSelect} data-test={dataTest} />
    </OptionStyled>
);

const FloatingSelectionsWrapper = styled.div<{ $elevation: Elevation }>`
    z-index: ${zIndices.modal};
    border-radius: ${borders.radii.sm};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    background: ${mapElevationToBackground};

    /* IMPORTANT: 
        When changing anything that causes change in height, 
        make sure you put correct number into size() 
        middleware of the Floating UI
    */

    padding: ${spacingsPx.xs} ${spacingsPx.xxs};
`;

const InnerScrollableWrapper = styled.div`
    height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;

    /* IMPORTANT: 
        When changing anything that causes change in height, 
        make sure you put correct number into size() 
        middleware of the Floating UI
    */

    padding: ${spacingsPx.sm} ${spacingsPx.md};
    gap: ${spacingsPx.md};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        gap: ${spacingsPx.md};
        padding: ${spacingsPx.xs} ${spacingsPx.sm} ${spacingsPx.md} ${spacingsPx.sm};
    }
`;

type FloatingSelectionsProps = {
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    style: CSSProperties;
    defaultType: BackupType;
};

const DefaultTag = () => {
    const { isMobileLayout } = useLayoutSize();

    return (
        <Badge
            variant="primary"
            inline
            margin={{ left: spacings.xxs }}
            size={isMobileLayout ? 'tiny' : undefined}
        >
            <Text typographyStyle="hint">
                <Translation id="TR_ONBOARDING_BACKUP_TYPE_DEFAULT" />
            </Text>
        </Badge>
    );
};

const UpgradableToMultiTag = () => {
    const { isMobileLayout } = useLayoutSize();

    return (
        <Badge
            variant="tertiary"
            inline
            margin={{ left: spacings.xxs }}
            size={isMobileLayout ? 'tiny' : undefined}
        >
            <Translation id="TR_ONBOARDING_BACKUP_TYPE_UPGRADABLE_TO_MULTI" />
        </Badge>
    );
};

const AdvancedTag = () => {
    const { isMobileLayout } = useLayoutSize();

    return (
        <Badge
            variant="tertiary"
            inline
            margin={{ left: spacings.xxs }}
            size={isMobileLayout ? 'tiny' : undefined}
        >
            <Translation id="TR_ONBOARDING_BACKUP_TYPE_ADVANCED" />
        </Badge>
    );
};

const FloatingSelections = forwardRef<HTMLDivElement, FloatingSelectionsProps>(
    ({ selected, onSelect, style, defaultType }, ref) => {
        const { elevation } = useElevation();
        const { isMobileLayout } = useLayoutSize();

        return (
            <FloatingSelectionsWrapper $elevation={elevation} ref={ref} style={style}>
                <InnerScrollableWrapper>
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
                                typographyStyle={isMobileLayout ? 'highlight' : 'titleSmall'}
                            >
                                <Translation id={typesToLabelMap['shamir-default']} />
                                {defaultType === 'shamir-default' ? (
                                    <DefaultTag />
                                ) : (
                                    <UpgradableToMultiTag />
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
                                typographyStyle={isMobileLayout ? 'highlight' : 'titleSmall'}
                            >
                                <Translation id={typesToLabelMap['shamir-advance']} />
                                {defaultType === 'shamir-advance' && <DefaultTag />}
                                <AdvancedTag />
                            </Text>
                            <Text typographyStyle="hint">
                                <Translation id="TR_ONBOARDING_SEED_TYPE_ADVANCED_DESCRIPTION" />
                            </Text>
                        </OptionText>
                    </Option>
                    <Divider margin={{ top: spacings.zero, bottom: spacings.zero }} />
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
                                typographyStyle={isMobileLayout ? 'highlight' : 'titleSmall'}
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
                                typographyStyle={isMobileLayout ? 'highlight' : 'titleSmall'}
                            >
                                <Translation id={typesToLabelMap['24-words']} />
                                {defaultType === '24-words' && <DefaultTag />}
                            </Text>
                        </OptionText>
                    </Option>
                </InnerScrollableWrapper>
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
    const { isMobileLayout } = useLayoutSize();

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(-(isMobileLayout ? SELECT_ELEMENT_HEIGHT_MOBILE : SELECT_ELEMENT_HEIGHT)),
            size({
                apply: ({ rects, elements, availableHeight }) => {
                    Object.assign(elements.floating.style, {
                        width: `${rects.reference.width}px`,
                        height: `${Math.min(availableHeight, isMobileLayout ? 317 : 341)}px`, // <--- IMPORTANT: Those number needs to be updated when auto-height of the floating element changes
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
            <SelectWrapper $elevation={elevation} ref={refs.setReference} {...getReferenceProps()}>
                <ElevationUp>
                    <SelectedOption isDisabled={isDisabled} onClick={() => setIsOpen(true)}>
                        <OptionText data-test={dataTest}>
                            <Text variant="tertiary" typographyStyle="hint">
                                <Translation id="TR_ONBOARDING_BACKUP_TYPE" />
                            </Text>
                            <Text typographyStyle={isMobileLayout ? 'highlight' : 'titleSmall'}>
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
