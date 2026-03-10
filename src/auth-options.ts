import type { BetterAuthOptions } from "better-auth/minimal";
import {
  anonymous,
  bearer,
  emailOTP,
  genericOAuth,
  jwt,
  magicLink,
  oidcProvider,
  oneTap,
  oneTimeToken,
  phoneNumber,
  twoFactor,
  username,
} from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { convex } from "./plugins/convex/index.js";
import { convexAdapter } from "./client/adapter.js";

// This is the config used to generate the *component-scoped* schema
// (src/component/schema.ts). Organization, admin, and other plugins whose
// tables should live in the ROOT schema (same-schema mode) are intentionally
// excluded here.
//
// To add org tables to the root schema, use the schema-only shims:
//   import { organization } from "@convex-dev/better-auth/schema";
//   getConvexAuthTables({ plugins: [organization()] })
export const options = {
  database: convexAdapter({} as any, {} as any),
  rateLimit: {
    storage: "database",
  },
  plugins: [
    twoFactor(),
    anonymous(),
    username(),
    phoneNumber(),
    magicLink({ sendMagicLink: async () => { } }),
    emailOTP({ sendVerificationOTP: async () => { } }),
    passkey(),
    genericOAuth({
      config: [
        {
          clientId: "",
          clientSecret: "",
          providerId: "",
        },
      ],
    }),
    oneTap(),
    oidcProvider({
      loginPage: "/login",
    }),
    bearer(),
    oneTimeToken(),
    jwt(),
    convex({
      authConfig: { providers: [{ applicationID: "convex", domain: "" }] },
    }),
  ],
} as BetterAuthOptions; // assert type to avoid overloading ts compiler
