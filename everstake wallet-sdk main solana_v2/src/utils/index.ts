/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { COMMON_ERROR_MESSAGES } from './constants/errors';

/**
 * `WalletSDKError` is a custom error class that extends the built-in `Error` class.
 * It provides additional properties for error handling within the Wallet SDK.
 *
 * @remarks
 * This class is needed to provide additional context for errors, such as a code
 * and the original error, if any.
 *
 * @public
 *
 * @param message - The error message.
 * @param code - A string representing the error code.
 * @param originalError - The original error that caused this error, if any.
 */

export class WalletSDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
  ) {
    super(message);
    // This line is needed to restore the correct prototype chain.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * `Blockchain` is an abstract class that provides a structure for blockchain-specific classes.
 * It includes methods for error handling and throwing errors.
 *
 * @remarks
 * This class should be extended by classes that implement blockchain-specific functionality.
 * The extending classes should provide their own `ERROR_MESSAGES` and `ORIGINAL_ERROR_MESSAGES`.
 *
 * @property ERROR_MESSAGES - An object that maps error codes to error messages.
 * @property ORIGINAL_ERROR_MESSAGES - An object that maps original error messages to user-friendly error messages.
 *
 *
 * **/
export abstract class Blockchain {
  protected abstract ERROR_MESSAGES: { [key: string]: string };
  protected abstract ORIGINAL_ERROR_MESSAGES: { [key: string]: string };

  /**
   * Handles errors that occur within the Ethereum class.
   *
   * @param {keyof typeof ERROR_MESSAGES} code - The error code associated with the error.
   * @param {Error | WalletSDKError | unknown} originalError - The original error that was thrown.
   *
   * If the original error is an instance of WalletSDKError, it is thrown as is.
   * If the original error is an instance of the built-in Error class, a new WalletSDKError is thrown with the original error as the cause.
   * If the original error is not an instance of WalletSDKError or Error, a new WalletSDKError is thrown with a generic message and code.
   */
  public handleError(
    code: keyof typeof this.ERROR_MESSAGES,
    originalError: Error | WalletSDKError | unknown,
  ) {
    const message = this.ERROR_MESSAGES[code];

    // If originalError is an instance of WalletSDKError, or if message or code is not defined,
    // throw the originalError
    if (originalError instanceof WalletSDKError || !message || !code) {
      throw originalError;
    }

    // If originalError is an instance of Error
    if (originalError instanceof Error) {
      // Find the first entry in ORIGINAL_ERROR_MESSAGES where the key is included in originalError.message
      // If such an entry is found, newMessage will be the value of that entry
      const newMessage = Object.entries(this.ORIGINAL_ERROR_MESSAGES).find(
        ([originalMessage]) => originalError.message.includes(originalMessage),
      )?.[1];

      const errorMessage =
        newMessage ||
        this.ERROR_MESSAGES[code] ||
        COMMON_ERROR_MESSAGES['UNKNOWN_ERROR'];

      throw new WalletSDKError(errorMessage, String(code), originalError);
    }

    throw new WalletSDKError(
      COMMON_ERROR_MESSAGES['UNKNOWN_ERROR'],
      'UNKNOWN_ERROR',
    );
  }
  /**
   * Throws a WalletSDKError with a specified error code and message.
   *
   * @param {keyof typeof ERROR_MESSAGES} code - The error code associated with the error.
   * @param {...string[]} values - The values to be inserted into the error message.
   *
   * The method retrieves the error message template associated with the provided code from the ERROR_MESSAGES object.
   * It then replaces placeholders in the message template with provided values and throws a WalletSDKError with the final message and the provided code.
   */
  public throwError(
    code: keyof typeof this.ERROR_MESSAGES,
    ...values: string[]
  ) {
    let message = this.ERROR_MESSAGES[code];
    values.forEach((value, index) => {
      message = message?.replace(`{${index}}`, value);
    });

    if (!message) {
      throw new WalletSDKError(
        COMMON_ERROR_MESSAGES['UNKNOWN_ERROR'],
        'UNKNOWN_ERROR',
      );
    }

    throw new WalletSDKError(message, String(code));
  }

  /**
   * Check if the URL is valid
   *
   * @param {string} url - URL
   * @returns a bool type result.
   *
   */
  public isValidURL(url: string): boolean {
    let urlClass;
    try {
      urlClass = new URL(url);
    } catch (_) {
      return false;
    }

    return urlClass.protocol === 'http:' || urlClass.protocol === 'https:';
  }
}
