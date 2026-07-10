import { parseCommand, ParseCommandError } from "@/lib/ai/parseCommand";
import { parseQuickCommand } from "@/lib/ai/parseQuickCommand";
import { getWeekDays, parseIsoDate } from "@/lib/dates/weekUtils";
import { applyCommand } from "@/lib/plan/applyCommand";
import type { ParsePlanRequest } from "@/types/commands";

export const runtime = "nodejs";

function isParsePlanRequest(value: unknown): value is ParsePlanRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const request = value as Partial<ParsePlanRequest>;

  return (
    typeof request.inputText === "string" &&
    typeof request.activeWeekStartDate === "string" &&
    typeof request.raceDate === "string" &&
    Array.isArray(request.existingWorkouts)
  );
}

function getActiveWeekWorkouts(request: ParsePlanRequest) {
  const activeWeekDates = new Set(
    getWeekDays(parseIsoDate(request.activeWeekStartDate)).map((day) => day.isoDate)
  );

  return request.existingWorkouts.filter((workout) => activeWeekDates.has(workout.date));
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isParsePlanRequest(body)) {
    return Response.json({ error: "Invalid parse-plan request." }, { status: 400 });
  }

  const parseRequest = {
    ...body,
    inputText: body.inputText.trim(),
  };

  if (!parseRequest.inputText) {
    return Response.json({ error: "Plan text is required." }, { status: 400 });
  }

  try {
    const command =
      parseQuickCommand({ inputText: parseRequest.inputText }) ??
      (await parseCommand({
        inputText: parseRequest.inputText,
        activeWeekStartDate: parseRequest.activeWeekStartDate,
        activeWeekWorkouts: getActiveWeekWorkouts(parseRequest),
      }));
    const preview = applyCommand({
      command,
      activeWeekStartDate: parseRequest.activeWeekStartDate,
      existingWorkouts: parseRequest.existingWorkouts,
    });

    return Response.json(preview);
  } catch (error) {
    if (error instanceof ParseCommandError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }

    return Response.json({ error: "Could not parse plan command." }, { status: 500 });
  }
}
