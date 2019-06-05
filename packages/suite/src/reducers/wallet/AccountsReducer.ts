import * as CONNECT from 'actions/constants/TrezorConnect';
import * as WALLET from 'actions/constants/wallet';
import * as ACCOUNT from 'actions/constants/account';


const initialState: State = [];

export const findDeviceAccounts = (
    state: State,
    device: TrezorDevice,
    network: string
): Array<Account> => {
    if (network) {
        return state.filter(
            addr =>
                (addr.deviceState === device.state ||
                    (addr.imported && addr.deviceID === (device.features || {}).device_id)) &&
                addr.network === network
        );
    }
    return state.filter(
        addr =>
            addr.deviceState === device.state ||
            (addr.imported && addr.deviceID === (device.features || {}).device_id)
    );
};

const createAccount = (state: State, account: Account): State => {
    // TODO check with device_id
    // check if account was created before
    const exist: ?Account = state.find(
        a =>
            a.descriptor === account.descriptor &&
            a.network === account.network &&
            a.deviceState === account.deviceState
    );
    if (exist) {
        return state;
    }
    const newState: State = [...state];
    newState.push(account);

    // sort the accounts array so the imported accounts always come before discovered accounts
    if (account.imported) {
        newState.sort((a, b) => Number(b.imported) - Number(a.imported) || a.index - b.index);
    }
    return newState;
};

const removeAccounts = (
    state: State,
    device: TrezorDevice,
    keepImportedAccounts = false
): State => {
    if (keepImportedAccounts) {
        return state.filter(account => account.deviceState !== device.state || account.imported);
    }
    return state.filter(account => account.deviceState !== device.state);
};

const clear = (state: State, devices: Array<TrezorDevice>): State => {
    let newState: State = [...state];
    devices.forEach(d => {
        newState = removeAccounts(newState, d);
    });
    return newState;
};

const updateAccount = (state: State, account: Account): State => {
    const index: number = state.findIndex(
        a =>
            a.descriptor === account.descriptor &&
            a.network === account.network &&
            a.deviceState === account.deviceState
    );
    const newState: State = [...state];
    newState[index] = account;
    return newState;
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ACCOUNT.CREATE:
            return createAccount(state, action.payload);

        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
            return removeAccounts(state, action.device);

        case CONNECT.RECEIVE_WALLET_TYPE:
            return removeAccounts(state, action.device, true); // removes all accounts except imported ones

        case WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA:
            return clear(state, action.devices);

        //case CONNECT.FORGET_SINGLE :
        //    return forgetAccounts(state, action);

        case ACCOUNT.UPDATE:
            return updateAccount(state, action.payload);

        case ACCOUNT.FROM_STORAGE:
            return action.payload;

        default:
            return state;
    }
};
