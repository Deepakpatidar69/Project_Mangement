import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, VStack, Text, Button } from "native-base";
import { TextInput, Platform } from "react-native";

import { RootState, AppDispatch } from "../../store";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import {
  clearTaskError,
  updatePrivateTask,
  updateProjectTask,
} from "../../store/slices/TaskSlice";
import { DESC_LENGTH, HEADER_LENGTH } from "../../utils/Constent";
import { useSetAtom } from "jotai";
import { isDisplayErrorMessageAtom } from "../../utils/Constent";
import { clearProjectError } from "../../store/slices/ProjectSlice";

// 👇 1. Import KeyboardAwareScrollView
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

// ─── Component Props ──────────────────────────────────────────────────────
interface UpdateTaskProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UpdateTask({ onSuccess, onCancel }: UpdateTaskProps) {
  const dispatch = useDispatch<AppDispatch>();

  // ─── Layout ──────────────────────────────────────────────────────────────
  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.width;

  const fs = useMemo(
    () => ({
      title: adjustSizeToResolveZoomInIssue(baseSize * 0.045),
      subTitle: adjustSizeToResolveZoomInIssue(baseSize * 0.04),
      charCount: adjustSizeToResolveZoomInIssue(baseSize * 0.031),
    }),
    [baseSize],
  );

  // ─── Redux State ──────────────────────────────────────────────────────────
  const { singleTask, loading, error } = useSelector(
    (state: RootState) => state.task,
  );

  // Global error modal setter
  const setErrorModal = useSetAtom(isDisplayErrorMessageAtom);

  // ─── Local Form State ─────────────────────────────────────────────────────
  const [taskHeader, setTaskHeader] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (singleTask) {
      setTaskHeader(singleTask.taskHeader || "");
      setTaskDesc(singleTask.taskDesc || "");
    }
  }, [singleTask]);

  // ── Show global error modal for a slice-level task error (e.g. background
  // refetch failure) — separate from the request-time error handled in
  // handleUpdate's catch block below ─────────────────────────────────────────
  useEffect(() => {
    if (!error) return;

    setErrorModal((prev) => ({
      ...prev,
      isModalOpen: true,
      title: "Something went wrong",
      subTitle:
        typeof error === "string"
          ? error
          : ((error as any)?.message ?? "Please try again."),
      onClickLeftButton: () => {
        dispatch(clearTaskError());
        dispatch(clearProjectError());
        navigation.back?.();
      },
    }));
  }, [error, setErrorModal]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!taskHeader.trim() || !taskDesc.trim() || !singleTask) return;

    try {
      setIsSubmitting(true);

      if (!singleTask.projectId) {
        await dispatch(
          updatePrivateTask({
            taskId: singleTask.taskId,
            taskHeader,
            taskDesc,
          }),
        ).unwrap();
      } else {
        await dispatch(
          updateProjectTask({
            taskId: singleTask.taskId,
            taskHeader,
            taskDesc,
            projectId: singleTask.projectId,
          }),
        ).unwrap();
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.log(`Update Task Error: ${err}`);

      setErrorModal((prev) => ({
        ...prev,
        isModalOpen: true,
        title: "Update failed",
        subTitle:
          typeof err === "string"
            ? err
            : ((err as any)?.message ??
              "Unable to update this task. Please try again."),
        onClickLeftButton: () => {
          clearTaskError();
          clearProjectError();
          navigation?.back();
        },
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box flex={1} bg="coolGray.50" onLayout={onLayout}>
      {containerDimensions.baseSize > 0 && (
        <>
          <CommonDetailHeader
            title="Edit Task"
            subtitle="Update the task name and description."
            onTabBackButton={onCancel}
            showEdit={false}
            fs={baseSize}
          />

          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: containerDimensions.height * 0.05,
            }}
          >
            <Box
              width={containerDimensions.width}
              mt={"2%"}
              px={"4%"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <VStack
                width={"100%"}
                bg="white"
                shadow={2}
                rounded="2xl"
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
                space={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
                mt={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              >
                {/* ── Task Header Input ── */}
                <VStack space={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}>
                  <Text
                    fontSize={fs.title}
                    fontWeight="600"
                    color="coolGray.800"
                  >
                    Task Name
                  </Text>
                  <Box
                    borderWidth={1}
                    borderColor="#E0E0E0"
                    borderRadius="xl"
                    px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                    pt={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                    bg="coolGray.50"
                  >
                    <TextInput
                      style={{
                        fontSize: fs.subTitle,
                        color: "#1A1A2E",
                        paddingVertical: 4,
                        minHeight: adjustSizeToResolveZoomInIssue(
                          baseSize * 0.15,
                        ),
                        textAlignVertical: "top",
                      }}
                      value={taskHeader}
                      numberOfLines={3}
                      onChangeText={setTaskHeader}
                      placeholder="Enter task title..."
                      placeholderTextColor="#BDBDBD"
                      maxLength={HEADER_LENGTH}
                    />
                    <Text
                      fontSize={fs.charCount}
                      color="#BDBDBD"
                      textAlign="right"
                    >
                      {taskHeader.length} / {HEADER_LENGTH}
                    </Text>
                  </Box>
                </VStack>

                {/* ── Task Description Input ── */}
                <VStack space={2}>
                  <Text
                    fontSize={fs.title}
                    fontWeight="600"
                    color="coolGray.800"
                  >
                    Description
                  </Text>
                  <Box
                    borderWidth={1}
                    borderColor="#E0E0E0"
                    borderRadius="xl"
                    px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                    pt={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                    bg="coolGray.50"
                  >
                    <TextInput
                      style={{
                        fontSize: fs.subTitle,
                        color: "#1A1A2E",
                        minHeight: baseSize * 0.26,
                        textAlignVertical: "top",
                        paddingVertical: 4,
                      }}
                      value={taskDesc}
                      onChangeText={setTaskDesc}
                      placeholder="Describe the task details..."
                      placeholderTextColor="#BDBDBD"
                      multiline
                      numberOfLines={5}
                      maxLength={DESC_LENGTH}
                    />
                    <Text
                      fontSize={fs.charCount}
                      color="#BDBDBD"
                      textAlign="right"
                      mb={1}
                    >
                      {taskDesc.length} / {DESC_LENGTH}
                    </Text>
                  </Box>
                </VStack>

                {/* ── Submit Button ── */}
                <Button
                  mt={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
                  bg="#5B3FFF"
                  rounded="xl"
                  py={adjustSizeToResolveZoomInIssue(baseSize * 0.035)}
                  _pressed={{ bgColor: "#4020f8" }}
                  isLoading={isSubmitting || loading}
                  isLoadingText="Updating..."
                  isDisabled={!taskHeader.trim() || !taskDesc.trim()}
                  onPress={handleUpdate}
                >
                  <Text fontSize={fs.subTitle} fontWeight="bold" color="white">
                    Save Task Changes
                  </Text>
                </Button>
              </VStack>
            </Box>
          </KeyboardAwareScrollView>
        </>
      )}
    </Box>
  );
}
