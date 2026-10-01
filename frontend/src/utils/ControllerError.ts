import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { ServiceError } from "./ServiceError";

/** Controller 层统一异常：controller 必须再次包装后才返回给 store/页面 */
export class ControllerError extends Error {
  readonly code: keyof typeof ERROR_CODES;
  readonly detail: Record<string, unknown>;
  readonly causeName: string;

  constructor(code: keyof typeof ERROR_CODES, detail: Record<string, unknown> = {}, causeName = "ServiceError") {
    super(ERROR_MESSAGES[code]);
    this.name = "ControllerError";
    this.code = code;
    this.detail = detail;
    this.causeName = causeName;
  }

  static wrap(error: unknown): ControllerError {
    if (error instanceof ControllerError) return error;
    if (error instanceof ServiceError) {
      return new ControllerError(error.code, error.detail, error.name);
    }
    return new ControllerError(
      "VALIDATION_FAILED",
      { message: error instanceof Error ? error.message : String(error) },
      error instanceof Error ? error.name : "Unknown"
    );
  }
}
