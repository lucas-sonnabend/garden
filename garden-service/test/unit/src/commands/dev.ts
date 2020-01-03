import { expect } from "chai"
import { DevCommand } from "../../../../src/commands/dev"

describe("DevCommand", () => {
  it("should be protected", async () => {
    const command = new DevCommand()
    expect(command.protected).to.be.true
  })

  it("should skip disabled services", async () => {
    throw "TODO"
  })

  it("should skip disabled tasks", async () => {
    throw "TODO"
  })

  it("should skip disabled tests", async () => {
    throw "TODO"
  })

  it("should skip services from disabled modules", async () => {
    throw "TODO"
  })

  it("should skip tasks from disabled modules", async () => {
    throw "TODO"
  })

  it("should skip tests from disabled modules", async () => {
    throw "TODO"
  })
})
