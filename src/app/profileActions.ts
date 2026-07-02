import type { Dispatch, SetStateAction } from "react";
import type { AvatarId } from "../data/catalog";
import { createProfile, updateProfileDetails, type Profile } from "../data/profileRepository";
import { describeSupabaseError } from "../data/supabaseError";
import { showMessage } from "./dialogs";
import { getUsernameCooldown } from "./profileProgress";
import type { Screen } from "./types";

type AuthStatus = "checking" | "ready" | "sending" | "saving";
type SaveStatus = "idle" | "saving";

export function createProfileActions({
  avatar,
  draftBio,
  draftUsername,
  profile,
  profileSaveStatus,
  role,
  sessionUserId,
  setAuthStatus,
  setAvatar,
  setDraftBio,
  setDraftUsername,
  setProfile,
  setProfileSaveStatus,
  setScreen,
  setUsername,
  setXp,
  username
}: {
  avatar: AvatarId;
  draftBio: string;
  draftUsername: string;
  profile: Profile | null;
  profileSaveStatus: SaveStatus;
  role: string;
  sessionUserId?: string;
  setAuthStatus: Dispatch<SetStateAction<AuthStatus>>;
  setAvatar: Dispatch<SetStateAction<AvatarId>>;
  setDraftBio: Dispatch<SetStateAction<string>>;
  setDraftUsername: Dispatch<SetStateAction<string>>;
  setProfile: Dispatch<SetStateAction<Profile | null>>;
  setProfileSaveStatus: Dispatch<SetStateAction<SaveStatus>>;
  setScreen: Dispatch<SetStateAction<Screen>>;
  setUsername: Dispatch<SetStateAction<string>>;
  setXp: Dispatch<SetStateAction<number>>;
  username: string;
}) {
  async function saveOnboardingProfile() {
    if (!sessionUserId) {
      setScreen("login");
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      showMessage("Username required", "Pick a unique username before continuing.");
      return;
    }

    setAuthStatus("saving");
    try {
      const savedProfile = await createProfile({
        id: sessionUserId,
        username: trimmedUsername,
        avatar,
        roleLabel: role
      });
      setProfile(savedProfile);
      setUsername(savedProfile.username);
      setDraftUsername(savedProfile.username);
      setXp(savedProfile.xp);
      setScreen("discover");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save profile.";
      showMessage("Profile not saved", message);
    } finally {
      setAuthStatus("ready");
    }
  }

  async function saveProfileDetails() {
    if (!sessionUserId || profileSaveStatus === "saving") return;

    const trimmedUsername = draftUsername.trim();
    const usernameCooldown = getUsernameCooldown(profile);
    const usernameChanged = Boolean(profile && trimmedUsername !== profile.username);

    if (trimmedUsername.length < 3) {
      showMessage("Profile not saved", "Display name must be at least 3 characters.");
      return;
    }

    if (usernameChanged && !usernameCooldown.canChange) {
      showMessage("Profile not saved", `You can change your display name again in ${usernameCooldown.daysLeft} day${usernameCooldown.daysLeft === 1 ? "" : "s"}.`);
      return;
    }

    setProfileSaveStatus("saving");
    try {
      const savedProfile = await updateProfileDetails({
        userId: sessionUserId,
        username: trimmedUsername,
        updateUsername: usernameChanged,
        avatar,
        bio: draftBio.slice(0, 160)
      });
      setProfile(savedProfile);
      setUsername(savedProfile.username);
      setDraftUsername(savedProfile.username);
      setAvatar(savedProfile.avatar);
      if (savedProfile.bio !== null || !draftBio.trim()) {
        setDraftBio(savedProfile.bio ?? "");
      } else {
        showMessage("Avatar saved", "Run supabase/add_profile_bio.sql to enable bio saving.", "Avatar saved. Run supabase/add_profile_bio.sql to enable bio saving.");
      }
    } catch (error) {
      const message = describeSupabaseError(error, "Could not save profile.");
      showMessage("Profile failed", message);
    } finally {
      setProfileSaveStatus("idle");
    }
  }

  return {
    saveOnboardingProfile,
    saveProfileDetails
  };
}
