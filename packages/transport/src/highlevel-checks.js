/* @flow */

// input checks for high-level transports

import type {TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';

export function info(res: mixed): {version: string, configured: boolean} {
  if (typeof res !== `object` || res == null) {
    throw new Error(`Wrong result type.`);
  }
  const version = res.version;
  if (typeof version !== `string`) {
    throw new Error(`Wrong result type.`);
  }
  const configured = !!(res.configured);
  return {version, configured};
}

export function version(version: mixed): string {
  if (typeof version !== `string`) {
    throw new Error(`Wrong result type.`);
  }
  return version.trim();
}

function convertSession(r: mixed): ?string {
  if (r == null) {
    return null;
  }
  if (typeof r !== `string`) {
    throw new Error(`Wrong result type.`);
  }
  return r;
}

export function devices(res: mixed): Array<TrezorDeviceInfoWithSession> {
  if (typeof res !== `object`) {
    throw new Error(`Wrong result type.`);
  }
  if (!(res instanceof Array)) {
    throw new Error(`Wrong result type.`);
  }
  return res.map((o: mixed): TrezorDeviceInfoWithSession => {
    if (typeof o !== `object` || o == null) {
      throw new Error(`Wrong result type.`);
    }
    const path = o.path;
    if (typeof path !== `string`) {
      throw new Error(`Wrong result type.`);
    }
    const pathS = path.toString();
    return {
      path: pathS,
      session: convertSession(o.session),
      debugSession: convertSession(o.debugSession),
      product: o.product,
      vendor: o.vendor,
      debug: !!o.debug,
    };
  });
}

export function acquire(res: mixed): string {
  if (typeof res !== `object` || res == null) {
    throw new Error(`Wrong result type.`);
  }
  const session = res.session;
  if (typeof session !== `string` && typeof session !== `number`) {
    throw new Error(`Wrong result type.`);
  }
  return session.toString();
}

export function call(res: mixed): MessageFromTrezor {
  if (typeof res !== `object` || res == null) {
    throw new Error(`Wrong result type.`);
  }
  const type = res.type;
  if (typeof type !== `string`) {
    throw new Error(`Wrong result type.`);
  }
  const message = res.message;
  if (typeof message !== `object` || message == null) {
    throw new Error(`Wrong result type.`);
  }
  return {type, message};
}

