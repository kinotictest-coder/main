import type { KinoticProjectConfig } from '@kinotic-ai/management-api'

const config: KinoticProjectConfig = {
  organizationId: "minds-ignited",
  applicationId: "todo-neon",
  entitiesPaths: [
    {
      path: "packages/domain/model",
      repositoryPath: "packages/domain/repositories",
      mirrorFolderStructure: true
    }
  ],
  fileExtensionForImports: ".js",
  validate: false
}

export default config
