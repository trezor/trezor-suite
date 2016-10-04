/* @flow */
/*global chrome:false*/
'use strict';

export type ChromeMessage = {
  type: string;
  body?: ?any; // should be Object | string; but in flow, Array is not Object
};

export async function exists(): Promise<void> {
  if (typeof chrome === `undefined`) {
    throw new Error(`Global chrome does not exist; probably not running chrome`);
  }
  if (typeof chrome.runtime === `undefined`) {
    throw new Error(`Global chrome.runtime does not exist; probably not running chrome`);
  }
  if (typeof chrome.runtime.sendMessage === `undefined`) {
    throw new Error(`Global chrome.runtime.sendMessage does not exist; probably not whitelisted website in extension manifest`);
  }
}

export function send(extensionId: string, message: ChromeMessage): Promise<mixed> {
  return new Promise(function (resolve, reject) {
    const callback = function (response?: mixed) {
      if (response === undefined) {
        console.error(`[trezor.js] [chrome-messages] Chrome runtime error`, chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      if (typeof response !== `object` || response == null) {
        reject(new Error(`Response is not an object.`));
        return;
      }
      if (response.type === `response`) {
        resolve(response.body);
      } else if (response.type === `error`) {
        console.error(`[trezor.js] [chrome-messages] Error received`, response);
        reject(new Error(response.message));
      } else {
        console.error(`[trezor.js] [chrome-messages] Unknown response type `, JSON.stringify(response.type));
        reject(new Error(`Unknown response type ` + JSON.stringify(response.type)));
      }
    };

    if (chrome.runtime.id === extensionId) {
      // extension sending to itself
      // (only for including trezor.js in the management part of the extension)
      chrome.runtime.sendMessage(message, {}, callback);
    } else {
      // either another extension, or not sent from extension at all
      // (this will be run most probably)
      chrome.runtime.sendMessage(extensionId, message, {}, callback);
    }
  });
}
