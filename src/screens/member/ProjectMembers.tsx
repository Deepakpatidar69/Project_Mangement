import React, { useCallback, useEffect, useState } from "react";
import { Box, HStack, Text, Pressable } from "native-base";
import { FlatList } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { MemberProps } from "../../store/slices/types";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import AppLoader from "../../components/CustomLoader";
import { clearMemberError, fetchMembers } from "../../store/slices/MemberSlice";
import { MemberCard } from "./MemberCard";
import {
  globalMenuAtom,
  isDisplayErrorMessageAtom,
} from "../../utils/Constent";
import { useAtom } from "jotai";
import {
  handleRemoveMember,
  onTapMemberRoleUpdate,
} from "../../modals/model.utils";

// --- MAIN COMPONENT ---
interface ProjectTeamMembersProps {
  projectId: string;
  userId: string;
  isAdmin: boolean;
  baseSize: number;
  fs: any;
  isProjectCompleted: boolean;
  onClickViewAll: () => void;
}

const ProjectTeamMembers: React.FC<ProjectTeamMembersProps> = ({
  projectId,
  userId,
  isAdmin,
  isProjectCompleted = false,
  baseSize,
  fs,
  onClickViewAll,
}) => {
  const [members, setMembers] = useState<MemberProps[]>([]);

  const {
    members: projectMembers,
    loading: memberLoading,
    error,
  } = useSelector((state: RootState) => state.member);

  const dispatch = useDispatch<AppDispatch>();
  const [, setGlobalMenu] = useAtom(globalMenuAtom);
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  const subTitleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.04);
  const meta = adjustSizeToResolveZoomInIssue(baseSize * 0.035);
  const avatarSize = adjustSizeToResolveZoomInIssue(baseSize * 0.12);

  const loadMembers = useCallback(() => {
    dispatch(fetchMembers({ projectId, limit: 4 }));
  }, [dispatch, projectId]);

  const handleUpdateRole = async (member: MemberProps) => {
    await onTapMemberRoleUpdate({
      currentRole: member.role,
      memberId: member.memberId,
      projectId: member.projectId,
    });
  };

  // ─── RESET LOGIC WHEN PROJECT ID CHANGES ───
  useEffect(() => {
    if (!projectId) return;

    // 1. Reset local state to empty immediately so old data doesn't linger
    setMembers([]);

    // 2. Clear any lingering errors from a previous project/search
    dispatch(clearMemberError());

    // 3. Fetch the new data
    loadMembers();
  }, [projectId, loadMembers, dispatch]);

  // ─── SYNC REDUX DATA SECURELY ───
  useEffect(() => {
    // Only update local state if we aren't actively loading.
    // This prevents stale Redux state from flashing on screen before the API responds.
    if (!memberLoading) {
      setMembers(projectMembers || []);
    }
  }, [projectMembers, memberLoading]);

  // ─── Show shared error modal whenever the member slice reports an error ───
  useEffect(() => {
    if (!error) return;

    setErrorModal((prev) => ({
      ...prev,
      isDisplay: true,
      title: "Something went wrong",
      subtitle:
        typeof error === "string"
          ? error
          : "We couldn't load the team members. Please try again.",
      onClickLeftButton: () => {
        dispatch(clearMemberError());
        // navigation.back?.(); // Uncomment if navigation is in scope
      },
    }));
  }, [error, setErrorModal, dispatch]);

  // ─── Make sure the modal doesn't linger after this component unmounts ───
  useEffect(() => {
    return () => {
      setErrorModal((prev) => ({ ...prev, isDisplay: false }));
    };
  }, [setErrorModal]);

  return (
    <Box width="100%" flex={1}>
      <HStack
        justifyContent="space-between"
        alignItems="center"
        flex={1}
        mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
      >
        <Text fontSize={fs.title} fontWeight="700" color="coolGray.900">
          Team Members
        </Text>
        <Pressable onPress={onClickViewAll}>
          <Text fontSize={fs.subTitle} color="indigo.500" fontWeight="600">
            View all members →
          </Text>
        </Pressable>
      </HStack>

      {memberLoading ? (
        <Box
          bg="white"
          rounded="2xl"
          p={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
          alignItems="center"
          shadow={1}
        >
          <AppLoader isLoading message="members loading" fullScreen={false} />
        </Box>
      ) : !members.length ? (
        <Box
          bg="white"
          rounded="2xl"
          p={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
          alignItems="center"
          shadow={1}
        >
          <Text color="coolGray.400" fontSize={fs.meta}>
            No members yet
          </Text>
        </Box>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.memberId}
          scrollEnabled={false}
          contentContainerStyle={{
            paddingBottom: adjustSizeToResolveZoomInIssue(baseSize * 0.05),
            rowGap: adjustSizeToResolveZoomInIssue(baseSize * 0.03),
          }}
          renderItem={({ item }) => {
            const isCurrentUser = item.assignedMemberId === userId;

            return (
              <MemberCard
                item={item}
                baseSize={baseSize}
                meta={meta}
                subTitleSize={subTitleSize}
                avatarSize={avatarSize}
                isAdmin={isAdmin}
                isCurrentUser={isCurrentUser}
                setGlobalMenu={setGlobalMenu}
                onUpdateRole={handleUpdateRole}
                onRemoveUser={handleRemoveMember}
                isProjectCompleted={isProjectCompleted}
              />
            );
          }}
        />
      )}
    </Box>
  );
};

export default ProjectTeamMembers;
