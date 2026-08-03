import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store";
import { updateProfile } from "../../store/slices/authSlice";
import { AuthProps } from "../../store/slices/types";
import { EditableProfileFields, EditProfileSection } from "./EditProfile";
import UserProfileSection from "./UserProfileSection";

function pickAndUploadAvatar(asset?: {
  uri: string;
  fileName?: string;
  type?: string;
}): void {
  // eslint-disable-next-line no-console
  console.log("pickAndUploadAvatar called with:", asset);

}

// ─────────────────────────────────────────────────────────────────────────
// Screen state
// ─────────────────────────────────────────────────────────────────────────

type Mode = "PROFILE" | "EDIT";

interface UserProfileProps {
  onTapBack?: () => void;
  user: AuthProps | null;
}

function UserProfile({ onTapBack, user }: UserProfileProps) {
  const [mode, setMode] = useState<Mode>("PROFILE");
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  // Profile → Edit
  const handleTapEditProfile = useCallback(() => {
    setMode("EDIT");
  }, []);

  // Edit → Profile (edit screen's own back button)
  const handleTapBackFromEdit = useCallback(() => {
    setMode("PROFILE");
  }, []);


  const handleUpdateProfile = useCallback(
    async (data: EditableProfileFields) => {
      setIsSaving(true);
      try {
        // `gender` is "" in form state (meaning "nothing selected" for the
        // <Select>), but updateProfile / AuthProps expects Gender | null.
        // Convert at this boundary rather than changing the form's type.
        await dispatch(
          updateProfile({
            ...data,
            gender: data.gender === "" ? null : data.gender,
            experience: Number(data.experience),
          }),
        ).unwrap();

        setMode("PROFILE");
      } catch (err) {
        Alert.alert(
          "Couldn't save changes",
          "Something went wrong while saving your profile. Please try again.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch],
  );

  if (mode === "EDIT") {
    return (
      <EditProfileSection
        user={user}
        onTapBack={handleTapBackFromEdit}
        onSave={handleUpdateProfile}
        isSaving={isSaving}
        isActive={mode === "EDIT"}
      />
    );
  }

  return (
    <UserProfileSection
      user={user}
      onTapBack={onTapBack}
      onTapEditProfile={handleTapEditProfile}
      isActive={mode === "PROFILE"}
    />
  );
}

export default UserProfile;
