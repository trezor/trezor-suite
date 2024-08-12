import { ElevationUp, Text, Warning, useElevation } from '@trezor/components';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';
import { useState } from 'react';
import styled from 'styled-components';
import { useLayoutSize, useSelector } from '../../../../hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
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
import { Translation } from '../../../../components/suite';
import { BackupType } from '../../../../reducers/onboarding/onboardingReducer';
import { OptionText, SelectedOption } from './OptionWithContent';
import { FloatingSelections } from './FloatingSelections';
import { typesToLabelMap } from './typesToLabelMap';
import { DeviceModelInternal } from '@trezor/connect';

const SELECT_ELEMENT_HEIGHT = 84;
const SELECT_ELEMENT_HEIGHT_MOBILE = 62;

const SHAMIR_TYPES: BackupType[] = ['shamir-single', 'shamir-advanced'];

export const isShamirBackupType = (type: BackupType) => SHAMIR_TYPES.includes(type);

export const defaultBackupTypeMap: Record<DeviceModelInternal, BackupType> = {
    [DeviceModelInternal.T1B1]: '24-words',
    [DeviceModelInternal.T2T1]: '12-words',
    [DeviceModelInternal.T2B1]: 'shamir-single',
    [DeviceModelInternal.T3B1]: 'shamir-single',
    [DeviceModelInternal.T3T1]: 'shamir-single',
};

type GetDefaultBackupTypeParams = { model: DeviceModelInternal; packaging: number };

export const getDefaultBackupType = ({
    model,
    packaging,
}: GetDefaultBackupTypeParams): BackupType => {
    // Original package of Trezor Safe 3 has a card with just 12 words.
    if (model === DeviceModelInternal.T2B1 && packaging === 0) {
        return '12-words';
    }

    return defaultBackupTypeMap[model];
};

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
    position: relative;
`;

const BackupWarning = ({ id }: { id: TranslationKey }) => (
    <Warning variant="info" withIcon>
        <Translation id={id} values={{ strong: chunks => <strong>{chunks}</strong> }} />
    </Warning>
);

type SelectBackupTypeProps = {
    isDisabled: boolean;
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    'data-testid'?: string;
    onOpen: () => void;
};

export const SelectBackupType = ({
    selected,
    onSelect,
    isDisabled,
    'data-testid': dataTest,
    onOpen,
}: SelectBackupTypeProps) => {
    const { elevation } = useElevation();
    const [isOpen, setIsOpen] = useState(false);
    const device = useSelector(selectDevice);
    const { isMobileLayout } = useLayoutSize();

    const defaultBackupType: BackupType = device?.features?.internal_model
        ? getDefaultBackupType({
              model: device.features.internal_model,
              packaging: device.features.unit_packaging ?? 0,
          })
        : 'shamir-single';

    const isDefault = defaultBackupType === selected;
    const isShamirDefault = isShamirBackupType(defaultBackupType);
    const isShamirSelected = isShamirBackupType(selected);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(-(isMobileLayout ? SELECT_ELEMENT_HEIGHT_MOBILE : SELECT_ELEMENT_HEIGHT) + 1),
            size({
                apply: ({ rects, elements, availableHeight }) => {
                    Object.assign(elements.floating.style, {
                        width: `${rects.reference.width - 2}px`,
                        maxHeight: `${availableHeight}px`,
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

    return (
        <Wrapper>
            <SelectWrapper $elevation={elevation} ref={refs.setReference} {...getReferenceProps()}>
                <ElevationUp>
                    <SelectedOption
                        isDisabled={isDisabled}
                        onClick={() => {
                            setIsOpen(true);
                            onOpen();
                        }}
                    >
                        <OptionText data-testid={dataTest}>
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
