import Ajv from 'ajv';

const getDuplicateIds = (ids: string[]) => {
    const seenIds = new Set<string>();

    return [...new Set(ids.filter(id => seenIds.size === seenIds.add(id).size))];
};

// checks that a config meets the criteria specified by the schema
export const validateJsonSchema = (config: string, schema: string) => {
    const ajv = new Ajv();

    let parsedConfig;
    let parsedSchema;

    try {
        parsedConfig = JSON.parse(config);
    } catch (err) {
        throw Error(`Invalid config JSON format: ${err.message}`, { cause: err });
    }

    try {
        parsedSchema = JSON.parse(schema);
    } catch (err) {
        throw Error(`Invalid schema JSON format: ${err.message}`, { cause: err });
    }

    const validate = ajv.compile(parsedSchema);
    const isValid = validate(parsedConfig);

    if (!isValid) {
        throw Error(`Config is invalid: ${JSON.stringify(validate.errors)}`);
    }

    const invalidExperiments =
        (parsedConfig as { experiments?: unknown[] }).experiments
            ?.map((experiment: any) => {
                const sum = (experiment?.experiment?.groups as any[]).reduce(
                    (acc: number, g: any) => acc + Number(g?.percentage ?? 0),
                    0,
                );

                return { id: experiment?.experiment?.id as string | undefined, sum };
            })
            .filter((experiment: { sum: number }) => experiment.sum !== 100) ?? [];

    if (invalidExperiments.length > 0) {
        const details = invalidExperiments.map(exp => `id=${exp.id}, sum=${exp.sum}`).join('; ');
        throw new Error(
            `Config is invalid: percentages must sum to 100. Failed experiments: ${details}`,
        );
    }

    const duplicateMessageIds = getDuplicateIds(
        (parsedConfig as { actions?: unknown[] }).actions
            ?.map((action: any) => action?.message?.id)
            .filter((id): id is string => typeof id === 'string') ?? [],
    );

    if (duplicateMessageIds.length > 0) {
        throw new Error(
            `Config is invalid: message ids must be unique. Duplicate ids: ${duplicateMessageIds.join(', ')}`,
        );
    }

    const duplicateExperimentIds = getDuplicateIds(
        (parsedConfig as { experiments?: unknown[] }).experiments
            ?.map((experiment: any) => experiment?.experiment?.id)
            .filter((id): id is string => typeof id === 'string') ?? [],
    );

    if (duplicateExperimentIds.length > 0) {
        throw new Error(
            `Config is invalid: experiment ids must be unique. Duplicate ids: ${duplicateExperimentIds.join(', ')}`,
        );
    }
};
