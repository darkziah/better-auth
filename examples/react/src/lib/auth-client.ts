import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import {
  magicLinkClient,
  emailOTPClient,
  organizationClient,
  adminClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  plugins: [
    magicLinkClient(),
    emailOTPClient(),
    organizationClient(),
    adminClient(),
    crossDomainClient(),
    convexClient(),
  ],
});
