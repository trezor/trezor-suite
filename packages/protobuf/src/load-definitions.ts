import { Root } from 'protobufjs/light';

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
    // get package MessageType enum
    let packageEnumType;
    try {
        packageEnumType = pkg.lookupEnum('MessageType');
    } catch {
        // empty
    }

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
