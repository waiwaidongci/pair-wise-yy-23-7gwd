import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/** Service 层统一异常：禁止在单一全局位置吞掉异常，service 必须先包一层 */
export class ServiceError extends Error {
  readonly code: keyof typeof ERROR_CODES;
  readonly detail: Record<string, unknown>;

  constructor(code: keyof typeof ERROR_CODES, detail: Record<string, unknown> = {}) {
    super(ERROR_MESSAGES[code]);
    this.name = "ServiceError";
    this.code = code;
    this.detail = detail;
  }
}
