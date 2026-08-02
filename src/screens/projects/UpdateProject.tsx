import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, VStack, Text, Button } from "native-base";
import { TextInput, Platform } from "react-native";
import { useAtom } from "jotai";

import { RootState, AppDispatch } from "../../store";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";

import {
  clearProjectError,
  updateProject,
} from "../../store/slices/ProjectSlice";
import {
  DESC_LENGTH,
  HEADER_LENGTH,
  isDisplayErrorMessageAtom,
} from "../../utils/Constent";

// 👇 1. Import KeyboardAwareScrollView
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

// 👇 Define props for the component
interface UpdateProjectProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UpdateProject({
  onSuccess,
  onCancel,
}: UpdateProjectProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  // ─── Layout ──────────────────────────────────────────────────────────────
  const { containerDimensions, onLayout } = useContainerDimensions();
  const [baseSize, setBaseSize] = useState<number>(0);

  const [fs, setFs] = useState<{
    title: number;
    subTitle: number;
    meta: number;
    charCount: number;
  }>({ charCount: 0, meta: 0, subTitle: 0, title: 0 });

  useEffect(() => {
    const baseSize = containerDimensions.baseSize;
    if (baseSize === 0) return;

    const computed = {
      title: adjustSizeToResolveZoomInIssue(baseSize * 0.045),
      subTitle: adjustSizeToResolveZoomInIssue(baseSize * 0.04),
      meta: adjustSizeToResolveZoomInIssue(baseSize * 0.035),
      charCount: adjustSizeToResolveZoomInIssue(baseSize * 0.031),
    };
    setFs(computed);
    setBaseSize(baseSize);
  }, [containerDimensions]);

  // ─── Redux State ──────────────────────────────────────────────────────────
  const { singleProject, loading } = useSelector(
    (state: RootState) => state.project,
  );

  // ─── Local Form State ─────────────────────────────────────────────────────
  const [projectHeader, setProjectHeader] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (singleProject) {
      setProjectHeader(singleProject.projectHeader || "");
      setProjectDesc(singleProject.projectDesc || "");
    }
  }, [singleProject]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!projectHeader.trim() || !projectDesc.trim() || !singleProject) return;

    try {
      setIsSubmitting(true);
      await dispatch(
        updateProject({
          projectId: singleProject.projectId,
          projectHeader,
          projectDesc,
        }),
      ).unwrap();

      // 👇 Call the success callback passed from the parent instead of navigation.goBack()
      if (onSuccess) onSuccess();
    } catch (error: any) {
      // Backend/slice error -> show shared error modal instead of just logging
      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Couldn't update project",
        subtitle:
          typeof error === "string"
            ? error
            : (error?.message ??
              "Something went wrong while saving your changes. Please try again."),
        onClickLeftButton: () => {
          dispatch(clearProjectError());
          onCancel(); // Use onCancel instead of navigation.back() to close this inline component
        },
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    // ✅ 1. Use flex: 1 for the main wrapper
    <Box flex={1} bg="coolGray.50" onLayout={onLayout}>
      {baseSize > 0 && (
        <>
          {/* ✅ 2. Keep the Header OUTSIDE the KeyboardAwareScrollView so it stays pinned */}
          <CommonDetailHeader
            title="Edit Project"
            subtitle="Update the basic details of your project."
            onTabBackButton={onCancel}
            showEdit={false}
            fs={baseSize}
            showMenuBar={false}
          />

          {/* 👇 3. Replaced KeyboardAvoidingView + ScrollView with KeyboardAwareScrollView */}
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
            contentContainerStyle={{
              // ✅ 4. CRITICAL: Use flexGrow: 1 instead of flex: 1
              flexGrow: 1,
              paddingBottom: containerDimensions.height * 0.05,
              width: containerDimensions.width,
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
                bg="white"
                shadow={2}
                width={adjustSizeToResolveZoomInIssue(
                  containerDimensions.width * 0.9,
                )}
                rounded="2xl"
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
                space={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
                mt={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              >
                {/* ── Project Header Input ── */}
                <VStack space={2}>
                  <Text
                    fontSize={fs.subTitle}
                    fontWeight="600"
                    color="coolGray.800"
                  >
                    Project Name
                  </Text>
                  <Box
                    borderWidth={1}
                    borderColor="#E0E0E0"
                    borderRadius="xl"
                    px={3}
                    py={2}
                    bg="coolGray.50"
                  >
                    <TextInput
                      style={{
                        fontSize: fs.subTitle,
                        color: "#1A1A2E",
                        paddingVertical: 2,
                      }}
                      value={projectHeader}
                      onChangeText={setProjectHeader}
                      placeholder="Enter project name..."
                      placeholderTextColor="#BDBDBD"
                      maxLength={HEADER_LENGTH}
                    />
                    <Text
                      fontSize={fs.charCount}
                      color="#BDBDBD"
                      textAlign="right"
                      mt={1}
                    >
                      {projectHeader.length} / {HEADER_LENGTH}
                    </Text>
                  </Box>
                </VStack>

                {/* ── Project Description Input ── */}
                <VStack space={2}>
                  <Text
                    fontSize={fs.subTitle}
                    fontWeight="600"
                    color="coolGray.800"
                  >
                    Description
                  </Text>
                  <Box
                    borderWidth={1}
                    borderColor="#E0E0E0"
                    borderRadius="xl"
                    px={3}
                    pt={2}
                    pb={1}
                    bg="coolGray.50"
                  >
                    <TextInput
                      style={{
                        fontSize: fs.subTitle,
                        color: "#1A1A2E",
                        minHeight: adjustSizeToResolveZoomInIssue(
                          baseSize * 0.26,
                        ),
                        textAlignVertical: "top",
                        paddingVertical: 4,
                      }}
                      value={projectDesc}
                      onChangeText={setProjectDesc}
                      placeholder="Describe your project..."
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
                      {projectDesc.length} / {DESC_LENGTH}
                    </Text>
                  </Box>
                </VStack>

                {/* ── Submit Button ── */}
                <Button
                  mt={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                  bg="#5B3FFF"
                  rounded="xl"
                  py={adjustSizeToResolveZoomInIssue(baseSize * 0.035)}
                  _pressed={{ bgColor: "#4020f8" }}
                  isLoading={isSubmitting || loading}
                  isLoadingText="Updating..."
                  isDisabled={!projectHeader.trim() || !projectDesc.trim()}
                  onPress={handleUpdate}
                >
                  <Text fontSize={fs.subTitle} fontWeight="bold" color="white">
                    Save Project Changes
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
