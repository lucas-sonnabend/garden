import { resolve } from "path"
import { expect } from "chai"
import { makeTestGardenA, makeTestGarden, dataDir, expectError, TestGarden } from "../../helpers"
import { getNames } from "../../../src/util/util"
import { ConfigGraph, DependencyGraphNode } from "../../../src/config-graph"
import { Garden } from "../../../src/garden"
import { ModuleConfig } from "../../../src/config/module"
import { DEFAULT_API_VERSION } from "../../../src/constants"

describe("ConfigGraph", () => {
  let gardenA: Garden
  let graphA: ConfigGraph

  before(async () => {
    gardenA = await makeTestGardenA()
    graphA = await gardenA.getConfigGraph(gardenA.log)
  })

  it("should throw when two services have the same name", async () => {
    const garden = await makeTestGarden(resolve(dataDir, "test-projects", "duplicate-service"))

    await expectError(
      () => garden.getConfigGraph(garden.log),
      (err) =>
        expect(err.message).to.equal(
          "Service names must be unique - the service name 'dupe' is declared multiple times " +
            "(in modules 'module-a' and 'module-b')"
        )
    )
  })

  it("should throw when two tasks have the same name", async () => {
    const garden = await makeTestGarden(resolve(dataDir, "test-projects", "duplicate-task"))

    await expectError(
      () => garden.getConfigGraph(garden.log),
      (err) =>
        expect(err.message).to.equal(
          "Task names must be unique - the task name 'dupe' is declared multiple times " +
            "(in modules 'module-a' and 'module-b')"
        )
    )
  })

  it("should throw when a service and a task have the same name", async () => {
    const garden = await makeTestGarden(resolve(dataDir, "test-projects", "duplicate-service-and-task"))

    await expectError(
      () => garden.getConfigGraph(garden.log),
      (err) =>
        expect(err.message).to.equal(
          "Service and task names must be mutually unique - the name 'dupe' is used for a task " +
            "in 'module-b' and for a service in 'module-a'"
        )
    )
  })

  it("should automatically add service source modules as module build dependencies", async () => {
    const garden = await makeTestGarden(resolve(dataDir, "test-projects", "source-module"))
    const graph = await garden.getConfigGraph(garden.log)
    const module = await graph.getModule("module-b")
    expect(module.build.dependencies).to.eql([{ name: "module-a", copy: [] }])
  })

  it("should ignore dependencies by services on disabled services", async () => {
    const garden = await TestGarden.factory("/tmp")
    const moduleTypes = garden.getModuleTypes()
    const moduleConfigs: ModuleConfig[] = [
      {
        apiVersion: DEFAULT_API_VERSION,
        allowPublish: false,
        build: { dependencies: [] },
        disabled: false,
        name: "foo",
        outputs: {},
        path: "/tmp",
        serviceConfigs: [
          {
            name: "disabled-service",
            dependencies: [],
            disabled: true,
            hotReloadable: false,
            spec: {},
          },
          {
            name: "enabled-service",
            dependencies: ["disabled-service"],
            disabled: true,
            hotReloadable: false,
            spec: {},
          },
        ],
        taskConfigs: [],
        spec: {},
        testConfigs: [],
        type: "foo",
      },
    ]
  })

  it("should ignore dependencies by services on disabled tasks", async () => {
    throw "TODO"
  })

  it("should ignore dependencies by services on services in disabled modules", async () => {
    const garden = await makeTestGardenA()
    const moduleConfigs: ModuleConfig[] = [
      {
        apiVersion: DEFAULT_API_VERSION,
        allowPublish: false,
        build: { dependencies: [] },
        disabled: false,
        name: "foo",
        outputs: {},
        path: "/tmp",
        serviceConfigs: [],
        taskConfigs: [],
        spec: {},
        testConfigs: [],
        type: "exec",
      },
    ]
  })

  it("should ignore dependencies by tasks on disabled services", async () => {
    throw "TODO"
  })

  it("should ignore dependencies by tests on disabled services", async () => {
    throw "TODO"
  })

  describe("getModules", () => {
    it("should scan and return all registered modules in the context", async () => {
      const modules = await graphA.getModules()
      expect(getNames(modules).sort()).to.eql(["module-a", "module-b", "module-c"])
    })

    it("should optionally return specified modules in the context", async () => {
      const modules = await graphA.getModules({ names: ["module-b", "module-c"] })
      expect(getNames(modules).sort()).to.eql(["module-b", "module-c"])
    })

    it("should omit disabled modules", async () => {
      throw "TODO"
    })

    it("should optionally include disabled modules", async () => {
      throw "TODO"
    })

    it("should throw if specifically requesting a disabled module", async () => {
      throw "TODO"
    })

    it("should throw if named module is missing", async () => {
      try {
        await graphA.getModules({ names: ["bla"] })
      } catch (err) {
        expect(err.type).to.equal("parameter")
        return
      }

      throw new Error("Expected error")
    })
  })

  describe("getServices", () => {
    it("should scan for modules and return all registered services in the context", async () => {
      const services = await graphA.getServices()

      expect(getNames(services).sort()).to.eql(["service-a", "service-b", "service-c"])
    })

    it("should optionally return specified services in the context", async () => {
      const services = await graphA.getServices({ names: ["service-b", "service-c"] })

      expect(getNames(services).sort()).to.eql(["service-b", "service-c"])
    })

    it("should omit disabled services", async () => {
      throw "TODO"
    })

    it("should optionally include disabled services", async () => {
      throw "TODO"
    })

    it("should throw if specifically requesting a disabled service", async () => {
      throw "TODO"
    })

    it("should throw if named service is missing", async () => {
      try {
        await graphA.getServices({ names: ["bla"] })
      } catch (err) {
        expect(err.type).to.equal("parameter")
        return
      }

      throw new Error("Expected error")
    })
  })

  describe("getService", () => {
    it("should return the specified service", async () => {
      const service = await graphA.getService("service-b")

      expect(service.name).to.equal("service-b")
    })

    it("should throw if service is missing", async () => {
      try {
        await graphA.getService("bla")
      } catch (err) {
        expect(err.type).to.equal("parameter")
        return
      }

      throw new Error("Expected error")
    })
  })

  describe("getTasks", () => {
    it("should scan for modules and return all registered tasks in the context", async () => {
      const tasks = await graphA.getTasks()
      expect(getNames(tasks).sort()).to.eql(["task-a", "task-b", "task-c"])
    })

    it("should optionally return specified tasks in the context", async () => {
      const tasks = await graphA.getTasks({ names: ["task-b", "task-c"] })
      expect(getNames(tasks).sort()).to.eql(["task-b", "task-c"])
    })

    it("should omit disabled tasks", async () => {
      throw "TODO"
    })

    it("should optionally include disabled tasks", async () => {
      throw "TODO"
    })

    it("should throw if specifically requesting a disabled task", async () => {
      throw "TODO"
    })

    it("should throw if named task is missing", async () => {
      try {
        await graphA.getTasks({ names: ["bla"] })
      } catch (err) {
        expect(err.type).to.equal("parameter")
        return
      }

      throw new Error("Expected error")
    })
  })

  describe("getTask", () => {
    it("should return the specified task", async () => {
      const task = await graphA.getTask("task-b")

      expect(task.name).to.equal("task-b")
    })

    it("should throw if task is missing", async () => {
      try {
        await graphA.getTask("bla")
      } catch (err) {
        expect(err.type).to.equal("parameter")
        return
      }

      throw new Error("Expected error")
    })
  })

  describe("getDependencies", () => {
    it("should include disabled modules in build dependencies", async () => {
      throw "TODO"
    })
  })

  describe("resolveDependencyModules", () => {
    it("should include disabled modules in build dependencies", async () => {
      throw "TODO"
    })
  })

  describe("resolveDependencyModules", () => {
    it("should resolve build dependencies", async () => {
      const modules = await graphA.resolveDependencyModules([{ name: "module-c", copy: [] }], [])
      expect(getNames(modules)).to.eql(["module-a", "module-b", "module-c"])
    })

    it("should resolve service dependencies", async () => {
      const modules = await graphA.resolveDependencyModules([], ["service-b"])
      expect(getNames(modules)).to.eql(["module-a", "module-b"])
    })

    it("should combine module and service dependencies", async () => {
      const modules = await graphA.resolveDependencyModules([{ name: "module-b", copy: [] }], ["service-c"])
      expect(getNames(modules)).to.eql(["module-a", "module-b", "module-c"])
    })
  })

  describe("render", () => {
    it("should render config graph nodes with test names", () => {
      const rendered = graphA.render()
      expect(rendered.nodes).to.have.deep.members([
        {
          type: "build",
          name: "module-a",
          moduleName: "module-a",
          key: "build.module-a",
        },
        {
          type: "build",
          name: "module-b",
          moduleName: "module-b",
          key: "build.module-b",
        },
        {
          type: "build",
          name: "module-c",
          moduleName: "module-c",
          key: "build.module-c",
        },
        {
          type: "test",
          name: "unit",
          moduleName: "module-c",
          key: "test.module-c.unit",
        },
        {
          type: "test",
          name: "integ",
          moduleName: "module-c",
          key: "test.module-c.integ",
        },
        {
          type: "run",
          name: "task-c",
          moduleName: "module-c",
          key: "task.task-c",
        },
        {
          type: "deploy",
          name: "service-c",
          moduleName: "module-c",
          key: "deploy.service-c",
        },
        {
          type: "test",
          name: "unit",
          moduleName: "module-a",
          key: "test.module-a.unit",
        },
        {
          type: "test",
          name: "integration",
          moduleName: "module-a",
          key: "test.module-a.integration",
        },
        {
          type: "run",
          name: "task-a",
          moduleName: "module-a",
          key: "task.task-a",
        },
        {
          type: "test",
          name: "unit",
          moduleName: "module-b",
          key: "test.module-b.unit",
        },
        {
          type: "run",
          name: "task-b",
          moduleName: "module-b",
          key: "task.task-b",
        },
        {
          type: "deploy",
          name: "service-a",
          moduleName: "module-a",
          key: "deploy.service-a",
        },
        {
          type: "deploy",
          name: "service-b",
          moduleName: "module-b",
          key: "deploy.service-b",
        },
      ])
    })
  })
})

describe("DependencyGraphNode", () => {
  describe("render", () => {
    it("should render a build node", () => {
      const node = new DependencyGraphNode("build", "module-a", "module-a")
      const res = node.render()
      expect(res).to.eql({
        type: "build",
        name: "module-a",
        moduleName: "module-a",
        key: "build.module-a",
      })
    })

    it("should render a deploy node", () => {
      const node = new DependencyGraphNode("deploy", "service-a", "module-a")
      const res = node.render()
      expect(res).to.eql({
        type: "deploy",
        name: "service-a",
        moduleName: "module-a",
        key: "deploy.service-a",
      })
    })

    it("should render a run node", () => {
      const node = new DependencyGraphNode("run", "task-a", "module-a")
      const res = node.render()
      expect(res).to.eql({
        type: "run",
        name: "task-a",
        moduleName: "module-a",
        key: "task.task-a",
      })
    })

    it("should render a test node", () => {
      const node = new DependencyGraphNode("test", "module-a.test-a", "module-a")
      const res = node.render()
      expect(res).to.eql({
        type: "test",
        name: "test-a",
        moduleName: "module-a",
        key: "test.module-a.test-a",
      })
    })
  })
})
