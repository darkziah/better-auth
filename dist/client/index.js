import { convexAdapter } from "./adapter.js";
import { version as convexVersion } from "convex";
import semverLt from "semver/functions/lt.js";
import { createClient } from "./create-client.js";
import { createApi } from "./create-api.js";
import { createLocalApi } from "./create-local-api.js";
import { createLocalAdapter } from "./create-local-api.js";
if (semverLt(convexVersion, "1.25.0")) {
    throw new Error("Convex version must be at least 1.25.0");
}
export { convexAdapter, createClient, createApi, createLocalApi, createLocalAdapter, };
export { getConvexAuthTables } from "./get-convex-auth-tables.js";
//# sourceMappingURL=index.js.map