import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type Experiments } from '@suite-common/suite-types';

import { parseAndValidateJsonForm } from './messageSystemFormCore';
import { selectMessageSystemConfig } from './messageSystemSelectors';
import { getDefaultExperiment } from './messageSystemUtils';
import { validateExperimentForm } from './messageSystemValidation';

type UseMessageSystemExperimentFormArgs = {
    // Maps a raw yup error message (e.g. the 'TR_REQUIRED_FIELD' key) to a display string.
    formatFieldError?: (message: string) => string;
};

export const useMessageSystemExperimentForm = ({
    formatFieldError,
}: UseMessageSystemExperimentFormArgs = {}) => {
    const config = useSelector(selectMessageSystemConfig);
    const [formData, setFormData] = useState<string>(() =>
        JSON.stringify(getDefaultExperiment(), null, 2),
    );
    const experimentIds = useMemo(
        () => new Set(config?.experiments?.map(experiment => experiment.experiment.id)),
        [config],
    );

    const { parsedData, validationErrors } = useMemo(
        () =>
            parseAndValidateJsonForm<Experiments, ReturnType<typeof validateExperimentForm>>({
                formData,
                validate: validateExperimentForm,
                getDuplicateIdError: validated =>
                    experimentIds.has(validated.experiment.id)
                        ? {
                              field: 'experiment.id',
                              message: `must be unique. “${validated.experiment.id}” is already in use.`,
                          }
                        : null,
                formatFieldError,
            }),
        [formData, formatFieldError, experimentIds],
    );

    const formatJSON = useCallback(() => {
        setFormData(JSON.stringify(parsedData, null, 2));
    }, [parsedData]);

    const applyPreset = useCallback(() => {
        setFormData(JSON.stringify(getDefaultExperiment(), null, 2));
    }, []);

    return {
        formData,
        setFormData,
        parsedData,
        validationErrors,
        isValid: validationErrors.length === 0,
        canFormat: parsedData !== null,
        formatJSON,
        applyPreset,
        resetForm: applyPreset,
    };
};
