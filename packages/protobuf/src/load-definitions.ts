import { Enum, type Root } from 'protobufjs/light';

type Definitions = Record<string, unknown>;

export const loadDefinitions = async (
    messages: Root,
    packageName: string,
    packageLoader: () => Definitions | Promise<Definitions>,
) => {
    // check if package already exists
    try {
        const pkg = messages.lookup(packageName);
        if (pkg) {
            return;
        }
    } catch {
        // empty
    }

    // get current MessageType enum
    let enumType;
    try {
        enumType = messages.lookupEnum('MessageType');
    } catch {
        // empty
    }

    // load definitions
    const packageMessages = await packageLoader();
    const pkg = messages.define(packageName, packageMessages);
    // get package MessageType enum — look only in the immediate children of the
    // package namespace, not up the hierarchy. protobufjs 7.5.x changed
    // lookupEnum() to traverse upward, which returns the root-level MessageType
    // instead of the package-local one and breaks the merge below.
    const packageEnumType = (() => {
        const { nested } = pkg;
        const candidate = nested?.['MessageType'];

        return candidate instanceof Enum ? candidate : undefined;
    })();

    // merge MessageType enums
    if (enumType && packageEnumType) {
        try {
            // move values from nested enum to top level
            Object.keys(packageEnumType.values).forEach(key => {
                enumType.add(key, packageEnumType.values[key]);
            });
            // remove nested enum
            pkg.remove(packageEnumType);
        } catch (e) {
            // remove whole package on merge error
            messages.remove(pkg);

            throw e;
        }
    }
};
