# @suite-common/redux-extra-dependencies

Suite-specific Redux extra-dependency contracts shared by the desktop and mobile composition roots.

This package owns the legacy `ExtraDependencies` and `CustomThunkAPI` types. New thunks should
declare their state and dependency requirements explicitly instead of depending on the global type.

## Extra dependencies concept

In `src/extraDependenciesType.ts` you can find the type used as the source of truth for the extra
dependencies object constructed separately in the desktop and mobile apps. This allows dependencies
from `packages/suite` to be passed to `@suite-common` packages.

Example of a simple extra dependencies definition:

```typescript
export type ExtraDependencies = {
    actions: {
        addTransaction: SuiteCompatibleActionCreatorWithPayload<Transaction>;
    };
    selectors: {
        selectTransactions: SuiteCompatibleSelector<Transactions[]>;
    };
};
```

The desktop Suite constructs an object implementing this type:

```typescript
import * as transactionsActions from '@wallet-actions/transactionsActions';
import { AppState } from '../types/suite';

export const extraDependencies: ExtraDependencies = {
    actions: {
        addTransaction: transactionsActions.add,
    },
    selectors: {
        selectTransactions: (state: AppState) => state.wallet.transactions.transactions,
    },
};
```

The mobile app does the same, but may use mocked actions and data for functionality that has not yet
been moved to `@suite-common`:

```typescript
export const extraDependencies: ExtraDependencies = {
    actions: {
        addTransaction: createAction<any>('@suite-native/notImplemented/addTransaction'),
    },
    selectors: {
        selectTransactions: () => [...testMocks.getWalletTransaction()],
    },
};
```

When functionality moves to `@suite-common`, remove it from the global extra dependencies and import
it directly from its domain package.

## Platform-specific APIs

Extra dependencies can also provide platform-specific APIs to common packages. For example, file
saving has different desktop and mobile implementations:

```typescript
export type ExtraDependencies = {
    utils: {
        saveFile: (fileContent: string, fileName: string) => Promise<void>;
    };
};
```

Desktop implementation:

```typescript
import { saveAs } from 'file-saver';

export const extraDependencies: ExtraDependencies = {
    utils: {
        saveFile: (fileContent, fileName) => saveAs(fileContent, fileName),
    },
};
```

Mobile implementation:

```typescript
import RNFS from 'react-native-fs';

export const extraDependencies: ExtraDependencies = {
    utils: {
        saveFile: (fileContent, fileName) => RNFS.writeFile(fileName, fileContent, 'utf8'),
    },
};
```
