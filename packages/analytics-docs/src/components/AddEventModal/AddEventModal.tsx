import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { validateAnalyticsEventName } from '@suite-common/analytics';
import { Column, Modal } from '@trezor/components';

import { CopyButton } from './CopyButton';
import { EventForm } from './EventForm';
import { EventGenerateResult } from './EventGenerateResult';
import type { EventDoc } from '../../types';
import {
    type EventFormState,
    createEmptyFormState,
    eventDocToFormState,
    generateEventFileContent,
    getChangelogErrorMessage,
    getConstantsFilePath,
    getEnumAdditionSnippet,
    getEnumContextSnippet,
    getEventContextForAI,
    getEventFilePath,
    getEventsIndexExportSnippet,
    getEventsIndexPath,
    getUsageExampleSnippet,
    isValidAppVersion,
} from '../../utils/eventFileUtils';

type AddEventModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /** When set, form is pre-filled with this event (e.g. from EventCard Edit). */
    initialEvent?: EventDoc | null;
};

export const AddEventModal = ({ isOpen, onClose, initialEvent }: AddEventModalProps) => {
    const [formState, setFormState] = useState<EventFormState>(createEmptyFormState);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        if (initialEvent) {
            setFormState(eventDocToFormState(initialEvent));
        } else {
            setFormState(createEmptyFormState());
        }
        setShowResult(false);
    }, [isOpen, initialEvent]);

    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    const handleGenerate = useCallback(() => {
        setShowResult(true);
    }, []);

    const eventNameTrimmed = formState.eventName.trim();
    const eventChangelogError = getChangelogErrorMessage(formState.changelog);
    const eventChangelogValid = !eventChangelogError;
    const attributesChangelogsValid = formState.attributes.every(
        a =>
            a.key.trim() === '' ||
            (a.changelog.length > 0 &&
                a.changelog.some(e => isValidAppVersion(e.version) && e.notes.trim() !== '')),
    );
    const allChangelogsValid = eventChangelogValid && attributesChangelogsValid;
    const eventNameValidationError = eventNameTrimmed
        ? validateAnalyticsEventName(eventNameTrimmed)
        : null;
    const eventNameValid = !eventNameTrimmed || !eventNameValidationError;

    const filePath = eventNameTrimmed ? getEventFilePath(formState.platform, eventNameTrimmed) : '';
    const constantsFilePath = getConstantsFilePath(formState.platform);
    const eventsIndexPath = getEventsIndexPath(formState.platform);
    const isEditing = !!initialEvent;
    const generatedCode = eventNameTrimmed ? generateEventFileContent(formState) : '';
    const enumSnippet = eventNameTrimmed ? getEnumAdditionSnippet(eventNameTrimmed) : '';
    const enumContextSnippet = eventNameTrimmed ? getEnumContextSnippet(eventNameTrimmed) : '';
    const eventsIndexExportSnippet = eventNameTrimmed
        ? getEventsIndexExportSnippet(eventNameTrimmed)
        : '';
    const usageExampleSnippet =
        eventNameTrimmed && formState.platform
            ? getUsageExampleSnippet(formState.platform, eventNameTrimmed)
            : '';

    const eventContextForAI = getEventContextForAI({
        formState,
        isEditing: !!initialEvent,
        filePath,
        constantsFilePath,
        eventsIndexPath,
    });

    const modalContent = (
        <Modal.Backdrop zIndex={100} onClick={undefined} alignment={{ x: 'center', y: 'center' }}>
            <Modal.ModalBase
                heading={`${initialEvent === null ? 'Add' : 'Edit'} analytics event`}
                onCancel={onClose}
                onBackClick={showResult ? () => setShowResult(false) : undefined}
                width={760}
                bottomContent={
                    !showResult ? (
                        <Modal.Button
                            onClick={handleGenerate}
                            isDisabled={
                                !eventNameTrimmed ||
                                !eventNameValid ||
                                !formState.descriptionTrigger.trim() ||
                                !allChangelogsValid
                            }
                        >
                            Generate file content
                        </Modal.Button>
                    ) : (
                        <CopyButton
                            textToCopy={eventContextForAI}
                            copyLabel="Copy context for AI"
                        />
                    )
                }
            >
                <Column gap={24}>
                    {!showResult ? (
                        <EventForm
                            formState={formState}
                            setFormState={setFormState}
                            eventChangelogError={eventChangelogError}
                        />
                    ) : (
                        <EventGenerateResult
                            isEditing={isEditing}
                            filePath={filePath}
                            constantsFilePath={constantsFilePath}
                            eventsIndexPath={eventsIndexPath}
                            enumSnippet={enumSnippet}
                            enumContextSnippet={enumContextSnippet}
                            generatedCode={generatedCode}
                            eventsIndexExportSnippet={eventsIndexExportSnippet}
                            usageExampleSnippet={usageExampleSnippet}
                        />
                    )}
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );

    if (!isOpen) return null;

    return createPortal(modalContent, document.body);
};
