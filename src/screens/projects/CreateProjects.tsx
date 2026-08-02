import React, { useState } from "react";
import {
  Box,
  Text,
  Pressable,
  HStack,
  VStack,
  Icon,
  FormControl,
  WarningOutlineIcon,
  Spinner,
} from "native-base";
import { Platform, TextInput } from "react-native";
// @ts-ignore
import { Feather, MaterialCommunityIcons } from "react-native-vector-icons";
import { useForm, Controller } from "react-hook-form";
import { useAtom } from "jotai";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import {
  adjustSizeToResolveZoomInIssue,
  getInsetTop,
} from "../../utils/Helper";

import CalendarPicker, {
  formatDatePicker,
  formatTime,
} from "../../components/CalenderPicker";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store";
import {
  clearProjectError,
  createProject,
} from "../../store/slices/ProjectSlice";
import { PriorityLevel } from "../../store/slices/types";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import {
  DESC_LENGTH,
  HEADER_LENGTH,
  isDisplayErrorMessageAtom,
} from "../../utils/Constent";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PRIORITIES } from "../utils/screen.utils";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { updateUserStats } from "../../store/slices/authSlice";

interface CreateProjectForm {
  projectHeader: string;
  projectDesc: string;
  priority: PriorityLevel;
  projectDeadline: Date;
}

function SectionHeader({
  iconName,
  title,
  subtitle,
  titleSize,
  subSize,
  iconSize,
  iconBoxSize,
  required,
}: any) {
  return (
    <HStack alignItems="center" space={3} mb={3}>
      <Box
        w={iconBoxSize}
        h={iconBoxSize}
        borderRadius="lg"
        bg="#EDE7F6"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={Feather} name={iconName} size={iconSize} color="#5B3FFF" />
      </Box>
      <VStack flex={1}>
        <HStack alignItems="center" space={1}>
          <Text fontSize={titleSize} fontWeight="700" color="#1A1A2E">
            {title}
          </Text>
          {required && (
            <Text fontSize={titleSize} fontWeight="700" color="#C62828">
              *
            </Text>
          )}
        </HStack>
        <Text fontSize={subSize} color="#9E9E9E" mt="0.5">
          {subtitle}
        </Text>
      </VStack>
    </HStack>
  );
}

export default function CreateProjectScreen() {
  type createProjectRoute = RouteProp<
    RouteStackParamStack,
    "CreateProjectScreen"
  >;

  const route = useRoute<createProjectRoute>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  const { onBack } = route.params;
  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.width;

  const dispatch = useDispatch<AppDispatch>();
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  const fs = {
    heroTitle: adjustSizeToResolveZoomInIssue(baseSize * 0.065),
    heroSub: adjustSizeToResolveZoomInIssue(baseSize * 0.036),
    sectionTitle: adjustSizeToResolveZoomInIssue(baseSize * 0.041),
    sectionSub: adjustSizeToResolveZoomInIssue(baseSize * 0.031),
    sectionIcon: adjustSizeToResolveZoomInIssue(baseSize * 0.041),
    input: adjustSizeToResolveZoomInIssue(baseSize * 0.036),
    charCount: adjustSizeToResolveZoomInIssue(baseSize * 0.031),
    priorityName: adjustSizeToResolveZoomInIssue(baseSize * 0.032),
    priorityIcon: adjustSizeToResolveZoomInIssue(baseSize * 0.038),
    cta: adjustSizeToResolveZoomInIssue(baseSize * 0.041),
    ctaHint: adjustSizeToResolveZoomInIssue(baseSize * 0.031),
  };

  const iconBoxSize = baseSize * 0.1;
  const folderBoxSize = baseSize * 0.25;
  const priorityCardW = adjustSizeToResolveZoomInIssue(baseSize * 0.19);

  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectForm>({
    defaultValues: {
      projectHeader: "",
      projectDesc: "",
      priority: "LOW",
      projectDeadline: new Date(new Date().getTime() + 60 * 60 * 1000),
    },
  });

  const onHandleSubmit = async (data: CreateProjectForm) => {
    setIsLoading(true);
    try {
      // 1. Wait for the project creation thunk to finish successfully
      await dispatch(createProject(data)).unwrap();

      // 2. Since it succeeded, update your local Redux user stats
      dispatch(
        updateUserStats({
          projectsCount: 1,
        }),
      );
      navigation.goBack();
    } catch (err: any) {
      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Couldn't create project",
        subtitle:
          typeof err === "string"
            ? err
            : (err?.message ??
              "Something went wrong while creating the project. Please try again."),
        onClickLeftButton: () => {
          dispatch(clearProjectError());
          navigation.goBack?.();
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flex={1} bg="coolGray.50" onLayout={onLayout}>
      {baseSize > 0 && (
        <>
          <Box
            position="absolute"
            left={5}
            top={adjustSizeToResolveZoomInIssue(getInsetTop() * 1.2)}
            zIndex={2}
          >
            <Pressable
              onPress={onBack}
              w={adjustSizeToResolveZoomInIssue(baseSize * 0.12)}
              h={adjustSizeToResolveZoomInIssue(baseSize * 0.12)}
              rounded="full"
              bg="coolGray.100"
              alignItems="center"
              justifyContent="center"
              shadow={1}
              _pressed={{
                bg: "coolGray.200",
                style: { transform: [{ scale: 0.9 }] },
              }}
            >
              <Icon
                as={Feather}
                name="arrow-left"
                size={adjustSizeToResolveZoomInIssue(fs.sectionIcon * 2)}
                color="#1A1A2E"
              />
            </Pressable>
          </Box>

          <Box
            flex={1}
            pt={adjustSizeToResolveZoomInIssue(getInsetTop() * 2.5)}
            px="3%"
          >
            <KeyboardAwareScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bottomOffset={20}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: containerDimensions.height * 0.05,
              }}
            >
              <Box px="4%" width={"100%"} pb={"4%"}>
                <HStack
                  width={"100%"}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <VStack flex={1} alignItems={"flex-start"}>
                    <Text
                      fontSize={fs.heroTitle}
                      fontWeight="800"
                      color="#1A1A2E"
                      lineHeight={fs.heroTitle * 1.22}
                    >
                      Create Project
                    </Text>
                    <Text
                      fontSize={fs.heroSub}
                      color="#757575"
                      mt={1}
                      lineHeight={fs.heroSub * 1.55}
                    >
                      Set up a new project and{"\n"}bring your ideas to life.
                    </Text>
                  </VStack>
                  <Box
                    w={folderBoxSize}
                    h={folderBoxSize}
                    borderRadius="2xl"
                    bg="#5B3FFF"
                    alignItems="center"
                    justifyContent="center"
                    style={{
                      elevation: 6,
                      shadowColor: "#5B3FFF",
                      shadowOpacity: 0.35,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 6 },
                    }}
                  >
                    <Icon
                      as={MaterialCommunityIcons}
                      name="folder-multiple-plus"
                      size={folderBoxSize * 0.38}
                      color="white"
                    />
                  </Box>
                </HStack>
              </Box>

              <Box
                mx="4%"
                bg="white"
                borderRadius="2xl"
                p="4%"
                mb={4}
                style={{
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                <Controller
                  control={control}
                  name="projectHeader"
                  rules={{ required: "Project name is required" }}
                  render={({ field: { onChange, value } }) => (
                    <FormControl isRequired isInvalid={!!errors.projectHeader}>
                      <SectionHeader
                        required
                        iconName="edit-2"
                        title="Project Name"
                        subtitle="Give your project a clear and unique name."
                        titleSize={fs.sectionTitle}
                        subSize={fs.sectionSub}
                        iconSize={fs.sectionIcon}
                        iconBoxSize={iconBoxSize}
                      />
                      <Box
                        borderWidth={1}
                        borderColor={
                          errors.projectHeader ? "#C62828" : "#E0E0E0"
                        }
                        borderRadius="xl"
                        px={3}
                        py={2}
                        bg="coolGray.50"
                      >
                        <TextInput
                          style={{
                            fontSize: fs.input,
                            color: "#1A1A2E",
                            paddingVertical: 2,
                            textAlignVertical: "top",
                          }}
                          placeholder="Enter project title"
                          placeholderTextColor="#BDBDBD"
                          value={value}
                          onChangeText={onChange}
                          maxLength={HEADER_LENGTH}
                          multiline
                        />
                        <Text
                          fontSize={fs.charCount}
                          color="#BDBDBD"
                          textAlign="right"
                          mt={1}
                        >
                          {value.length} / {HEADER_LENGTH}
                        </Text>
                      </Box>
                      <FormControl.ErrorMessage
                        leftIcon={<WarningOutlineIcon size="xs" />}
                      >
                        {errors.projectHeader?.message}
                      </FormControl.ErrorMessage>
                    </FormControl>
                  )}
                />

                <Box h="1px" bg="#F5F5F5" my={5} />

                <Controller
                  control={control}
                  name="projectDesc"
                  rules={{ required: "Project description is required" }}
                  render={({ field: { onChange, value } }) => (
                    <FormControl isRequired isInvalid={!!errors.projectDesc}>
                      <SectionHeader
                        required
                        iconName="align-left"
                        title="Project Description"
                        subtitle="Describe your project goals."
                        titleSize={fs.sectionTitle}
                        subSize={fs.sectionSub}
                        iconSize={fs.sectionIcon}
                        iconBoxSize={iconBoxSize}
                      />
                      <Box
                        borderWidth={1}
                        borderColor={errors.projectDesc ? "#C62828" : "#E0E0E0"}
                        borderRadius="xl"
                        px={3}
                        pt={2}
                        pb={1}
                        bg="coolGray.50"
                      >
                        <TextInput
                          style={{
                            flex: 1,
                            fontSize: fs.input,
                            color: "#1A1A2E",
                            minHeight: baseSize * 0.24,
                            textAlignVertical: "top",
                          }}
                          placeholder="Description..."
                          placeholderTextColor="#BDBDBD"
                          value={value}
                          onChangeText={onChange}
                          multiline
                          maxLength={DESC_LENGTH}
                        />
                        <Text
                          fontSize={fs.charCount}
                          color="#BDBDBD"
                          textAlign="right"
                          mt={1}
                        >
                          {value.length} / {DESC_LENGTH}
                        </Text>
                      </Box>
                      <FormControl.ErrorMessage
                        leftIcon={<WarningOutlineIcon size="xs" />}
                      >
                        {errors.projectDesc?.message}
                      </FormControl.ErrorMessage>
                    </FormControl>
                  )}
                />

                <Box h="1px" bg="#F5F5F5" my={5} />

                <Controller
                  control={control}
                  name="projectDeadline"
                  rules={{
                    validate: (date) =>
                      date > new Date() || "Deadline cannot be in the past.",
                  }}
                  render={({ field: { onChange, value } }) => (
                    <FormControl
                      isRequired
                      isInvalid={!!errors.projectDeadline}
                    >
                      <SectionHeader
                        required
                        iconName="calendar"
                        title="Project Deadline"
                        subtitle="Select the deadline for your project."
                        titleSize={fs.sectionTitle}
                        subSize={fs.sectionSub}
                        iconSize={fs.sectionIcon}
                        iconBoxSize={iconBoxSize}
                      />
                      <Pressable
                        onPress={() => setShowCalendar((v) => !v)}
                        borderWidth={1.5}
                        borderColor={
                          errors.projectDeadline ? "#C62828" : "#5B3FFF"
                        }
                        borderRadius="xl"
                        px={3}
                        py={3}
                      >
                        <HStack
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <HStack alignItems="center" space={2} flex={1}>
                            <Icon
                              as={Feather}
                              name="calendar"
                              size={fs.sectionIcon}
                              color="#5B3FFF"
                            />
                            <Text
                              fontSize={fs.input}
                              fontWeight="600"
                              color="#1A1A2E"
                            >
                              {formatDatePicker(value)}
                            </Text>
                          </HStack>
                          <Box w="1px" h={fs.input * 1.4} bg="#E0E0E0" mx={2} />
                          <HStack alignItems="center" space={2}>
                            <Icon
                              as={Feather}
                              name="clock"
                              size={fs.sectionIcon}
                              color="#9E9E9E"
                            />
                            <Text fontSize={fs.input} color="#757575">
                              {formatTime(value)}
                            </Text>
                          </HStack>
                        </HStack>
                      </Pressable>
                      <FormControl.ErrorMessage
                        leftIcon={<WarningOutlineIcon size="xs" />}
                      >
                        {errors.projectDeadline?.message}
                      </FormControl.ErrorMessage>

                      {showCalendar && (
                        <CalendarPicker
                          selectedDate={value}
                          onSelect={(d) => {
                            onChange(d);
                            setShowCalendar(false);
                          }}
                          fs={{
                            iconSize: fs.sectionIcon,
                            inputTextSize: fs.sectionTitle,
                            subTitleTextSize: fs.sectionSub,
                            titleTextSize: fs.sectionTitle,
                          }}
                        />
                      )}
                    </FormControl>
                  )}
                />

                <Box h="1px" bg="#F5F5F5" my={5} />

                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { onChange, value } }) => (
                    <>
                      <SectionHeader
                        required
                        iconName="star"
                        title="Priority Level"
                        subtitle="Choose the priority level for this project."
                        titleSize={fs.sectionTitle}
                        subSize={fs.sectionSub}
                        iconSize={fs.sectionIcon}
                        iconBoxSize={iconBoxSize}
                      />
                      <HStack
                        width={"100%"}
                        justifyContent="space-between"
                        space={"1%"}
                      >
                        {PRIORITIES.map((opt) => {
                          const selected = value === opt.value;
                          return (
                            <Pressable
                              key={opt.value}
                              onPress={() => onChange(opt.value)}
                              w={priorityCardW}
                              borderWidth={selected ? 1.5 : 1}
                              borderColor={
                                selected ? opt.borderColor : "#E0E0E0"
                              }
                              borderRadius="xl"
                              bg={selected ? opt.selectedBg : "white"}
                              py={2}
                              alignItems="center"
                            >
                              <HStack
                                alignItems="center"
                                justifyContent="center"
                                space={1}
                              >
                                <Icon
                                  as={Feather}
                                  name={opt.iconName as any}
                                  size={fs.priorityIcon}
                                  color={opt.iconColor}
                                />
                                <Text
                                  fontSize={fs.priorityName}
                                  fontWeight={selected ? "700" : "500"}
                                  color={selected ? opt.iconColor : "#1A1A2E"}
                                  numberOfLines={1}
                                >
                                  {opt.label}
                                </Text>
                              </HStack>
                            </Pressable>
                          );
                        })}
                      </HStack>
                    </>
                  )}
                />
              </Box>

              <Box px="4%">
                <Pressable
                  onPress={handleSubmit((data) => onHandleSubmit?.(data))}
                  disabled={isLoading}
                  bg="#5B3FFF"
                  borderRadius="xl"
                  py={2}
                  alignItems="center"
                  justifyContent="center"
                  _pressed={{ opacity: 0.88 }}
                >
                  {isLoading ? (
                    <Spinner
                      color="white"
                      size={adjustSizeToResolveZoomInIssue(fs.heroTitle)}
                    />
                  ) : (
                    <HStack alignItems="center" space={2}>
                      <Icon
                        as={MaterialCommunityIcons}
                        name="folder-multiple-plus"
                        size={folderBoxSize * 0.25}
                        color="white"
                      />
                      <Text
                        fontSize={fs.cta}
                        fontWeight="700"
                        color="white"
                        letterSpacing={0.3}
                      >
                        Create Project
                      </Text>
                    </HStack>
                  )}
                </Pressable>
              </Box>
            </KeyboardAwareScrollView>
          </Box>
        </>
      )}
    </Box>
  );
}
