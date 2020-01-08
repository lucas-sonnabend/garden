import tmp from "tmp-promise"
import execa from "execa"

import { ProjectConfig } from "../../../../src/config/project"
import { DEFAULT_API_VERSION } from "../../../../src/constants"
import { Garden } from "../../../../src/garden"
import { GardenPlugin } from "../../../../src/types/plugin/plugin"
import { joi } from "../../../../src/config/common"
import { ServiceState } from "../../../../src/types/service"
import { DeployTask } from "../../../../src/tasks/deploy"
import { DeployServiceParams } from "../../../../src/types/plugin/service/deployService"
import { RunTaskParams } from "../../../../src/types/plugin/task/runTask"
import { expect } from "chai"

describe("DeployTask", () => {
  let tmpDir: tmp.DirectoryResult
  let config: ProjectConfig

  before(async () => {
    tmpDir = await tmp.dir({ unsafeCleanup: true })

    await execa("git", ["init"], { cwd: tmpDir.path })

    config = {
      apiVersion: DEFAULT_API_VERSION,
      kind: "Project",
      name: "test",
      path: tmpDir.path,
      defaultEnvironment: "default",
      dotIgnoreFiles: [],
      environments: [{ name: "default", variables: {} }],
      providers: [{ name: "test" }],
      variables: {},
    }
  })

  after(async () => {
    await tmpDir.cleanup()
  })

  describe("process", () => {
    it("should correctly resolve runtime outputs from tasks", async () => {
      const testPlugin: GardenPlugin = {
        name: "test",
        createModuleTypes: [
          {
            name: "test",
            docs: "test",
            serviceOutputsSchema: joi.object().keys({ log: joi.string() }),
            handlers: {
              build: async () => ({}),
              getServiceStatus: async () => {
                return {
                  state: <ServiceState>"missing",
                  detail: {},
                  outputs: {},
                }
              },
              deployService: async ({ service }: DeployServiceParams) => {
                return {
                  state: <ServiceState>"ready",
                  detail: {},
                  outputs: { log: service.spec.log },
                }
              },
              runTask: async ({ task }: RunTaskParams) => {
                const log = task.spec.log

                return {
                  taskName: task.name,
                  moduleName: task.module.name,
                  success: true,
                  outputs: { log },
                  command: [],
                  log,
                  startedAt: new Date(),
                  completedAt: new Date(),
                  version: task.module.version.versionString,
                }
              },
            },
          },
        ],
      }

      const garden = await Garden.factory(tmpDir.path, { config, plugins: [testPlugin] })

      garden["moduleConfigs"] = {
        test: {
          apiVersion: DEFAULT_API_VERSION,
          name: "test",
          type: "test",
          allowPublish: false,
          disabled: false,
          build: { dependencies: [] },
          outputs: {},
          path: tmpDir.path,
          serviceConfigs: [
            {
              name: "test-service",
              dependencies: ["test-task"],
              disabled: false,
              hotReloadable: false,
              spec: {
                log: "${runtime.tasks.test-task.outputs.log}",
              },
            },
          ],
          taskConfigs: [
            {
              name: "test-task",
              dependencies: [],
              disabled: false,
              spec: {
                log: "test output",
              },
              timeout: 10,
            },
          ],
          testConfigs: [],
          spec: { bla: "fla" },
        },
      }

      const graph = await garden.getConfigGraph(garden.log)
      const testService = await graph.getService("test-service")

      const deployTask = new DeployTask({
        garden,
        graph,
        service: testService,
        force: true,
        forceBuild: false,
        log: garden.log,
      })

      const result = await garden.processTasks([deployTask])

      expect(result[deployTask.getKey()]!.output.outputs).to.eql({ log: "test output" })
    })
  })
})
