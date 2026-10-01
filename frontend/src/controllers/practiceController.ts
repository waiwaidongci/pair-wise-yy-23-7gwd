import {
  finishPracticeSession,
  getFrozenQuestion,
  gradeAnswer,
  startPracticeSession,
  type FinishSessionInput,
  type GradeAnswerInput,
  type StartSessionInput
} from "../services/practiceSessionService";
import { ControllerError } from "../utils/ControllerError";
import type { PracticeSession } from "../types/PracticeSession";

export function beginSession(input: StartSessionInput) {
  try {
    return startPracticeSession(input);
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}

export function readFrozenQuestion(session: PracticeSession, index: number) {
  try {
    return getFrozenQuestion(session, index);
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}

export async function submitAnswer(input: GradeAnswerInput) {
  try {
    return await gradeAnswer(input);
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}

export async function completeSession(input: FinishSessionInput) {
  try {
    return await finishPracticeSession(input);
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}
