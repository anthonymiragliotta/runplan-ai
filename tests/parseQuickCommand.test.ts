import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuickCommand } from "@/lib/ai/parseQuickCommand";

describe("parseQuickCommand", () => {
  it("parses simple day mileage workouts without OpenAI", () => {
    const command = parseQuickCommand({
      inputText: "Monday 5 easy, Wednesday 2 warmup 4 tempo 2 cooldown, Sunday off",
    });

    assert.equal(command?.intent, "CREATE_OR_UPDATE_WORKOUTS");
    assert.equal(command.workouts.length, 3);
    assert.equal(command.workouts[0].dayName, "Monday");
    assert.equal(command.workouts[0].miles, 5);
    assert.equal(command.workouts[0].workoutType, "Easy");
    assert.equal(command.workouts[1].dayName, "Wednesday");
    assert.equal(command.workouts[1].miles, 8);
    assert.equal(command.workouts[1].speedMiles, 4);
    assert.equal(command.workouts[1].details.warmupMiles, 2);
    assert.equal(command.workouts[1].details.tempoMiles, 4);
    assert.equal(command.workouts[1].details.cooldownMiles, 2);
    assert.equal(command.workouts[2].workoutType, "Rest");
  });

  it("parses common move and swap commands", () => {
    const moveCommand = parseQuickCommand({ inputText: "move Saturday to Sunday" });
    const swapCommand = parseQuickCommand({ inputText: "swap Tuesday and Friday" });

    assert.equal(moveCommand?.intent, "MOVE_WORKOUT");
    assert.equal(moveCommand.sourceDayName, "Saturday");
    assert.equal(moveCommand.targetDayName, "Sunday");
    assert.equal(swapCommand?.intent, "SWAP_WORKOUTS");
    assert.equal(swapCommand.targetDayName, "Tuesday");
    assert.equal(swapCommand.secondTargetDayName, "Friday");
  });

  it("returns null for language that should fall back to AI", () => {
    assert.equal(parseQuickCommand({ inputText: "make this week feel lighter but keep the workout vibe" }), null);
  });
});
