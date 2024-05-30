import {
    Badge,
    Divider,
    ElevationUp,
    Icon,
    Radio,
    Row,
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
import styled, { css } from 'styled-components';
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

    padding: ${spacingsPx.sm} 0;
`;

const OptionStyled = styled.div<{ $hasHoverInteraction?: boolean }>`
    display: flex;
    flex-direction: row;

    gap: ${spacingsPx.md};

    padding-top: ${spacingsPx.sm};
    padding-bottom: ${spacingsPx.sm};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding-top: ${spacingsPx.xs};
        padding-bottom: ${spacingsPx.xs};
    }

    align-items: center;
    cursor: pointer;

    ${({ $hasHoverInteraction }) =>
        $hasHoverInteraction === true
            ? css`
                  &:hover {
                      background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};

                      margin-left: -10px;
                      margin-right: -10px;
                      padding-left: 10px;
                      padding-right: 10px;

                      ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
                          margin-left: -6px;
                          margin-right: -6px;
                          padding-left: 6px;
                          padding-right: 6px;
                      }

                      border-radius: ${borders.radii.xs};
                  }
              `
            : ''}
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

    padding: ${spacingsPx.xxs} ${spacingsPx.xl};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: 0 ${spacingsPx.sm};
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
    <OptionStyled onClick={onSelect} $hasHoverInteraction={true}>
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

    padding: 0 ${spacingsPx.xxs};
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

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: ${spacingsPx.xs} ${spacingsPx.sm};
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
            margin={{ left: spacings.xs }}
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
            margin={{ left: spacings.xs }}
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
            margin={{ left: spacings.xs }}
            size={isMobileLayout ? 'tiny' : undefined}
        >
            <Translation id="TR_ONBOARDING_BACKUP_TYPE_ADVANCED" />
        </Badge>
    );
};

const DividerWrapper = styled.div`
    margin-top: ${spacingsPx.xs};
    margin-bottom: ${spacingsPx.xs};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        margin-top: ${spacingsPx.xxs};
        margin-bottom: ${spacingsPx.xxs};
    }
`;

type OptionWithContentProps = {
    value: BackupType;
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    children: ReactNode;
    tags: ReactNode;
};

const OptionWithContent = ({
    onSelect,
    selected,
    value,
    children,
    tags,
}: OptionWithContentProps) => {
    const { isMobileLayout } = useLayoutSize();

    return (
        <Option
            onSelect={() => onSelect(value)}
            isChecked={selected === value}
            data-test={`@onboarding/select-seed-type-${value}`}
        >
            <OptionText>
                <Row alignItems="center">
                    <Text
                        variant={selected === value ? undefined : 'tertiary'}
                        typographyStyle={isMobileLayout ? 'highlight' : 'titleSmall'}
                    >
                        <Translation id={typesToLabelMap[value]} />
                    </Text>
                    {tags}
                </Row>
                {children}
            </OptionText>
        </Option>
    );
};

type LegacyOptionsProps = {
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    defaultType: BackupType;
};

const LegacyOptions = ({ defaultType, onSelect, selected }: LegacyOptionsProps) => {
    return (
        <>
            <OptionWithContent
                onSelect={onSelect}
                selected={selected}
                value="12-words"
                tags={<>{defaultType === '12-words' && <DefaultTag />}</>}
            >
                {defaultType === '12-words' && (
                    <Text typographyStyle="hint">
                        <Translation id="TR_ONBOARDING_BACKUP_TYPE_12_WORDS_DEFAULT_NOTE" />
                    </Text>
                )}
            </OptionWithContent>

            <OptionWithContent
                onSelect={onSelect}
                selected={selected}
                value="24-words"
                tags={<>{defaultType === '24-words' && <DefaultTag />}</>}
            >
                <></>
            </OptionWithContent>
        </>
    );
};

type ShamirOptionsProps = {
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    defaultType: BackupType;
};

const ShamirOptions = ({ defaultType, onSelect, selected }: ShamirOptionsProps) => (
    <>
        <OptionWithContent
            onSelect={onSelect}
            selected={selected}
            value="shamir-default"
            tags={
                <>{defaultType === 'shamir-default' ? <DefaultTag /> : <UpgradableToMultiTag />}</>
            }
        >
            <Text typographyStyle="hint">
                <Translation id="TR_ONBOARDING_SEED_TYPE_SINGLE_SEED_DESCRIPTION" />
            </Text>
        </OptionWithContent>

        <OptionWithContent
            onSelect={onSelect}
            selected={selected}
            value="shamir-advance"
            tags={
                <>
                    {defaultType === 'shamir-advance' && <DefaultTag />}
                    <AdvancedTag />
                </>
            }
        >
            <Text typographyStyle="hint">
                <Translation id="TR_ONBOARDING_SEED_TYPE_ADVANCED_DESCRIPTION" />
            </Text>
        </OptionWithContent>
    </>
);

const FloatingSelections = forwardRef<HTMLDivElement, FloatingSelectionsProps>(
    ({ selected, onSelect, style, defaultType }, ref) => {
        const { elevation } = useElevation();

        return (
            <FloatingSelectionsWrapper $elevation={elevation} ref={ref} style={style}>
                <InnerScrollableWrapper>
                    <OptionGroupHeading>
                        <Text typographyStyle="hint" variant="tertiary">
                            <Translation id="TR_ONBOARDING_BACKUP_CATEGORY_20_WORD_BACKUPS" />
                        </Text>
                    </OptionGroupHeading>
                    <ShamirOptions
                        defaultType={defaultType}
                        onSelect={onSelect}
                        selected={selected}
                    />
                    <DividerWrapper>
                        <Divider margin={{ top: spacings.zero, bottom: spacings.zero }} />
                    </DividerWrapper>

                    <OptionGroupHeading>
                        <Text typographyStyle="hint" variant="tertiary">
                            <Translation
                                id="TR_ONBOARDING_BACKUP_OLDER_BACKUP_TYPES"
                                values={{ br: () => <br /> }}
                            />
                        </Text>
                    </OptionGroupHeading>
                    <LegacyOptions
                        defaultType={defaultType}
                        onSelect={onSelect}
                        selected={selected}
                    />
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
            offset(-(isMobileLayout ? SELECT_ELEMENT_HEIGHT_MOBILE : SELECT_ELEMENT_HEIGHT) + 1),
            size({
                apply: ({ rects, elements, availableHeight }) => {
                    Object.assign(elements.floating.style, {
                        width: `${rects.reference.width - 2}px`,
                        height: `${Math.min(availableHeight, isMobileLayout ? 333 : 389)}px`, // <--- IMPORTANT: Those number needs to be updated when auto-height of the floating element changes
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
