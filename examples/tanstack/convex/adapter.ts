import { createLocalApi } from '@convex-dev/better-auth'
import schema from './schema'
import { twoFactor, anonymous, organization, admin } from 'better-auth/plugins'

// Note: We intentionally do NOT import from auth.ts to avoid circular dependency.
// createLocalApi only needs plugin configuration for schema generation (getAuthTables).
export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createLocalApi(schema, () => ({
  plugins: [
    twoFactor(),
    anonymous(),
    organization({ teams: { enabled: true } }),
    admin(),
  ],
}))
