import { getWeekDays, parseIsoDate } from "@/lib/dates/weekUtils";
import type { PlanCommand } from "@/types/commands";
import type { Workout } from "@/types/workout";

type ParseCommandInput = {
  inputText: string;
  activeWeekStartDate: string;
  activeWeekWorkouts: Workout[];
};

const PARSER_MODEL = "gpt-5-mini";

export class ParseCommandError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ParseCommandError";
    this.status = status;
    this.code = code;
  }
}

const nullableString = { type: ["string", "null"] };
const nullableNumber = { type: ["number", "null"] };

const workoutDetailsSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "warmupMiles",
    "cooldownMiles",
    "tempoMiles",
    "thresholdMiles",
    "marathonPaceMiles",
    "intervalReps",
    "intervalDistance",
    "intervalRecovery",
    "paceStart",
    "paceEnd",
    "durationMinutes",
    "description",
  ],
  properties: {
    warmupMiles: nullableNumber,
    cooldownMiles: nullableNumber,
    tempoMiles: nullableNumber,
    thresholdMiles: nullableNumber,
    marathonPaceMiles: nullableNumber,
    intervalReps: nullableNumber,
    intervalDistance: nullableString,
    intervalRecovery: nullableString,
    paceStart: nullableString,
    paceEnd: nullableString,
    durationMinutes: nullableNumber,
    description: nullableString,
  },
};

export const commandResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "intent",
    "confidence",
    "targetDayName",
    "targetDate",
    "sourceDayName",
    "sourceDate",
    "secondTargetDayName",
    "secondTargetDate",
    "scaleFactor",
    "workouts",
    "explanation",
    "ambiguities",
    "warnings",
  ],
  properties: {
    intent: {
      type: "string",
      enum: [
        "CREATE_OR_UPDATE_WORKOUTS",
        "UPDATE_WORKOUT",
        "MOVE_WORKOUT",
        "DELETE_WORKOUT",
        "SWAP_WORKOUTS",
        "SCALE_WEEK",
        "UNKNOWN",
      ],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    targetDayName: nullableString,
    targetDate: nullableString,
    sourceDayName: nullableString,
    sourceDate: nullableString,
    secondTargetDayName: nullableString,
    secondTargetDate: nullableString,
    scaleFactor: nullableNumber,
    workouts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "dayName",
          "date",
          "workoutType",
          "title",
          "miles",
          "speedMiles",
          "details",
          "notes",
        ],
        properties: {
          dayName: nullableString,
          date: nullableString,
          workoutType: {
            type: ["string", "null"],
            enum: [
              "Easy",
              "Recovery",
              "Long Run",
              "Tempo",
              "Threshold",
              "Intervals",
              "Track",
              "Hill Repeats",
              "Marathon Pace",
              "Progression",
              "Fartlek",
              "Race",
              "Shakeout",
              "Peloton",
              "Bike",
              "Cross Training",
              "Strength",
              "Rest",
              "Custom",
              null,
            ],
          },
          title: nullableString,
          miles: nullableNumber,
          speedMiles: nullableNumber,
          details: workoutDetailsSchema,
          notes: nullableString,
        },
      },
    },
    explanation: { type: "string" },
    ambiguities: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
  },
} satisfies Record<string, unknown>;

function isPlanCommand(value: unknown): value is PlanCommand {
  if (!value || typeof value !== "object") {
    return false;
  }

  const command = value as Partial<PlanCommand>;

  return (
    typeof command.intent === "string" &&
    typeof command.confidence === "number" &&
    Array.isArray(command.workouts) &&
    typeof command.explanation === "string" &&
    Array.isArray(command.ambiguities) &&
    Array.isArray(command.warnings)
  );
}

function getOutputText(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  const body = responseBody as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof body.output_text === "string") {
    return body.output_text;
  }

  return (
    body.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text" && typeof content.text === "string")
      ?.text ?? null
  );
}

function compactWorkout(workout: Workout) {
  return {
    d: workout.date,
    t: workout.title,
    type: workout.workoutType,
    mi: workout.miles,
    sp: workout.speedMiles,
    long: workout.isLongRun,
    rest: workout.isRest,
    cross: workout.isCrossTraining,
    strength: workout.isStrength,
  };
}

function buildCommandPrompt({
  inputText,
  activeWeekStartDate,
  activeWeekWorkouts,
}: ParseCommandInput) {
  const week = getWeekDays(parseIsoDate(activeWeekStartDate)).map((day) => ({
    day: day.dayName,
    date: day.isoDate,
  }));

  return [
    {
      role: "system",
      content:
        "Convert running-plan text to one compact command. Do not apply rules or mutate workouts. Use weekday names when the user gives weekdays. Use null for missing values. Bare mileage means miles only. Warmup/cooldown are details, not speed. Tempo/threshold/marathon pace are speed miles. Peloton/bike means cross-training. Lift/strength should be noted in notes/details. Off/rest means Rest. If unclear, intent UNKNOWN.",
    },
    {
      role: "user",
      content: JSON.stringify({
        text: inputText,
        week,
        activeWeekWorkouts: activeWeekWorkouts.map(compactWorkout),
      }),
    },
  ];
}

async function getOpenAiError(response: Response) {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text) as {
      error?: {
        message?: string;
        code?: string | null;
        type?: string;
      };
    };

    return {
      message: parsed.error?.message ?? text,
      code: parsed.error?.code ?? parsed.error?.type ?? null,
    };
  } catch {
    return {
      message: text || "OpenAI parser request failed.",
      code: null,
    };
  }
}

export async function parseCommand(input: ParseCommandInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ParseCommandError("OPENAI_API_KEY is not configured on the server.", 500);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PARSER_MODEL,
      input: buildCommandPrompt(input),
      text: {
        format: {
          type: "json_schema",
          name: "runplan_command",
          strict: true,
          schema: commandResponseSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await getOpenAiError(response);
    throw new ParseCommandError(error.message, response.status, error.code);
  }

  const body: unknown = await response.json();
  const outputText = getOutputText(body);

  if (!outputText) {
    throw new ParseCommandError("OpenAI response did not include output text.", 502);
  }

  let parsedOutput: unknown;

  try {
    parsedOutput = JSON.parse(outputText);
  } catch {
    throw new ParseCommandError("OpenAI response was not valid JSON.", 502);
  }

  if (!isPlanCommand(parsedOutput)) {
    throw new ParseCommandError("OpenAI response did not match command shape.", 502);
  }

  return parsedOutput;
}
