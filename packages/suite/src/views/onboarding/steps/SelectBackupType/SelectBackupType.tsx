import { useState } from 'react';

import {
    FloatingFocusManager,
    FloatingPortal,
    autoUpdate,
    offset,
    size,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
} from '@floating-ui/react';
import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectDeviceDefaultBackupType } from '@suite-common/device';
import { type BackupType } from '@suite-common/suite-types';
import { Banner, ElevationUp, Text, useElevation } from '@trezor/components';
import {
    type Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

import { useLayoutSize, useSelector } from 'src/hooks/suite';

import { FloatingSelections } from './FloatingSelections';
import { OptionText, SelectedOption } from './OptionWithContent';
import { typesToLabelMap } from './typesToLabelMap';
import { isShamirBackupType } from '../utils';

const SELECT_ELEMENT_HEIGHT = 84;
const SELECT_ELEMENT_HEIGHT_MOBILE = 62;

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: ${spacingsPx.xl};
`;

const SelectWrapper = styled.div<{ $elevation: Elevation }>`
    width: 700px;
    border-radius: ${borders.radii.sm};
    border: 1px solid ${mapElevationToBorder};
    background: ${mapElevationToBackground};
    position: relative;
`;

const BackupWarning = ({ id }: { id: TranslationKey }) => (
    <Banner
        intent="info"
        icon
        description={
            <Translation id={id} values={{ strong: chunks => <strong>{chunks}</strong> }} />
        }
    />
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
    const deviceDefaultBackupType = useSelector(selectDeviceDefaultBackupType);
    const { isBelowTablet } = useLayoutSize();

    const isShamirDefault = isShamirBackupType(deviceDefaultBackupType);
    const isShamirSelected = isShamirBackupType(selected);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(-(isBelowTablet ? SELECT_ELEMENT_HEIGHT_MOBILE : SELECT_ELEMENT_HEIGHT) + 1),
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
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                <Translation id="TR_ONBOARDING_BACKUP_TYPE" />
                            </Text>
                            <Text
                                typographyStyle={isBelowTablet ? 'body-md-strong' : 'headline-sm'}
                            >
                                <Translation id={typesToLabelMap[selected]} />
                            </Text>
                        </OptionText>
                    </SelectedOption>
                    {isOpen && (
                        <FloatingPortal>
                            <FloatingFocusManager context={context} modal={false}>
                                <FloatingSelections
                                    defaultType={deviceDefaultBackupType}
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
