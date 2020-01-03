import { expect } from "chai"
import { omit } from "lodash"
import { makeTestGardenA, withDefaultGlobalOpts } from "../../../../helpers"
import { RunTestCommand } from "../../../../../src/commands/run/test"

describe("RunTestCommand", () => {
  it("should run a test", async () => {
    const garden = await makeTestGardenA()
    const log = garden.log
    const cmd = new RunTestCommand()

    const { result } = await cmd.action({
      garden,
      log,
      headerLog: log,
      footerLog: log,
      args: { test: "test-a", module: "module-a" },
      opts: withDefaultGlobalOpts({ "force-build": false }),
    })

    const expected = {
      command: ["echo", "OK"],
      moduleName: "module-a",
      log: "echo OK",
      outputs: {
        log: "echo OK",
      },
      success: true,
      taskName: "task-a",
    }

    const omittedKeys = ["dependencyResults", "description", "type", "completedAt", "startedAt", "version"]

    throw "TODO"
    // expect(omit(result!.output, omittedKeys)).to.eql(expected)
  })

  it("should throw if the test is disabled", async () => {
    throw "TODO"
  })

  it("should throw if the test's module is disabled", async () => {
    throw "TODO"
  })
})
