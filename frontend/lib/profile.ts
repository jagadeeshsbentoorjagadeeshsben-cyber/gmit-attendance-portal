import "server-only";
import { getDb } from "./mongo";

/**
 * Profile storage abstraction. Currently backed by MongoDB storing the
 * profile photo as a base64 data URL. Kept intentionally small so the
 * storage backend can be swapped for object storage later without
 * touching the profile UI or route handlers.
 */

export interface StoredProfile {
  usn: string;
  photo: string | null; // data URL or null
  updatedAt: string;
}

const COLLECTION = "profiles";

export async function getProfile(usn: string): Promise<StoredProfile> {
  const db = await getDb();
  const doc = await db
    .collection<StoredProfile>(COLLECTION)
    .findOne({ usn }, { projection: { _id: 0 } });
  return doc ?? { usn, photo: null, updatedAt: new Date(0).toISOString() };
}

export async function setProfilePhoto(
  usn: string,
  photo: string
): Promise<StoredProfile> {
  const db = await getDb();
  const updatedAt = new Date().toISOString();
  await db
    .collection<StoredProfile>(COLLECTION)
    .updateOne(
      { usn },
      { $set: { usn, photo, updatedAt } },
      { upsert: true }
    );
  return { usn, photo, updatedAt };
}

export async function removeProfilePhoto(usn: string): Promise<StoredProfile> {
  const db = await getDb();
  const updatedAt = new Date().toISOString();
  await db
    .collection<StoredProfile>(COLLECTION)
    .updateOne(
      { usn },
      { $set: { usn, photo: null, updatedAt } },
      { upsert: true }
    );
  return { usn, photo: null, updatedAt };
}
