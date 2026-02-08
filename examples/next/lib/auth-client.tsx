"use client";

import {
  twoFactorClient,
  magicLinkClient,
  emailOTPClient,
  genericOAuthClient,
  anonymousClient,
  inferAdditionalFields,
  organizationClient,
  adminClient,
} from "better-auth/client/plugins";
import type { auth } from "@/convex/auth";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { PropsWithChildren } from "react";
import { api } from "@/convex/_generated/api";
import { AuthBoundary } from "@convex-dev/better-auth/react";
import { isAuthError } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<auth>(),
    anonymousClient(),
    magicLinkClient(),
    emailOTPClient(),
    twoFactorClient(),
    genericOAuthClient(),
    organizationClient(),
    adminClient(),
    convexClient(),
  ],
});

export const ClientAuthBoundary = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  return (
    <AuthBoundary
      authClient={authClient}
      onUnauth={() => router.push("/sign-in")}
      getAuthUserFn={api.auth.getAuthUser}
      isAuthError={isAuthError}
    >
      {children}
    </AuthBoundary>
  );
};
