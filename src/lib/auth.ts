import { cookies } from "next/headers";
import { db } from "./db";
import { verifyPassword } from "./crypto";
import { createHmac, timingSafeEqual } from "crypto";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "WHOLESALER" | "RETAILER";
  isApproved: boolean;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }
  return secret;
}

function signSession(data: string): string {
  const signature = createHmac("sha256", getSessionSecret()).update(data).digest("hex");
  return `${data}.${signature}`;
}

function verifySession(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.');
  if (lastDot === -1) return null;
  const data = signed.substring(0, lastDot);
  const sig = signed.substring(lastDot + 1);
  const expected = createHmac("sha256", getSessionSecret()).update(data).digest("hex");
  const actualBuffer = Buffer.from(sig, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  return data;
}

export async function login(email: string, password: string): Promise<UserSession | null> {
  // Simple check in DB
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) return null;
  if (!user.isApproved) return null;

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) return null;

  const sessionData: UserSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "WHOLESALER" | "RETAILER",
    isApproved: user.isApproved,
  };

  const cookieStore = await cookies();
  cookieStore.set("b2b_session", signSession(JSON.stringify(sessionData)), {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 60 * 60 * 24, // 1 day
  });

  return sessionData;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("b2b_session");
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("b2b_session");

  if (!session || !session.value) return null;

  try {
    const verifiedData = verifySession(session.value);
    if (!verifiedData) return null;
    return JSON.parse(verifiedData) as UserSession;
  } catch {
    return null;
  }
}

export async function assertUser(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user || !user.isApproved) {
    throw new Error("غير مصرح.");
  }
  return user;
}

export async function assertRole(role: UserSession["role"]): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user || !user.isApproved || user.role !== role) {
    throw new Error("غير مصرح.");
  }
  return user;
}
