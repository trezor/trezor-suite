declare module 'web3' {

    module.exports = {
        eth:  {
            _requestManager: any;
            iban: {
                (iban: string): void;
                fromAddress: (address: string) => any;
                fromBban: (bban: string) => any;
                createIndirect: (options: any) => any;
                isValid: (iban: string) => boolean;
            };
            sendIBANTransaction: any;
            contract: (abi: any) => {
                eth: any;
                abi: any[];
                new: (...args: any[]) => {
                    _eth: any;
                    transactionHash: any;
                    address: any;
                    abi: any[];
                };
                at: (address: any, callback: Function) => any;
                getData: (...args: any[]) => any;
            };
            filter: (fil: any, callback: any, filterCreationErrorCallback: any) => {
                requestManager: any;
                options: any;
                implementation: {
                    [x: string]: any;
                };
                filterId: any;
                callbacks: any[];
                getLogsCallbacks: any[];
                pollFilters: any[];
                formatter: any;
                watch: (callback: any) => any;
                stopWatching: (callback: any) => any;
                get: (callback: any) => any;
            };
            namereg: () => {
                eth: any;
                abi: any[];
                new: (...args: any[]) => {
                    _eth: any;
                    transactionHash: any;
                    address: any;
                    abi: any[];
                };
                at: (address: any, callback: Function) => any;
                getData: (...args: any[]) => any;
            };
            icapNamereg: () => {
                eth: any;
                abi: any[];
                new: (...args: any[]) => {
                    _eth: any;
                    transactionHash: any;
                    address: any;
                    abi: any[];
                };
                at: (address: any, callback: Function) => any;
                getData: (...args: any[]) => any;
            };
            isSyncing: (callback: any) => {
                requestManager: any;
                pollId: string;
                callbacks: any[];
                lastSyncState: boolean;
                addCallback: (callback: any) => any;
                stopWatching: () => void;
            };
        }
    }
}