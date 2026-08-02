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
import { TextInput } from "react-native";
import {
  Feather,
  Ionicons,
  MaterialIcons,
  Octicons,
  // @ts-ignore
} from "react-native-vector-icons";
import { useForm, Controller } from "react-hook-form";
import { useAtom } from "jotai";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import {
  adjustSizeToResolveZoomInIssue,
  getInsetTop,
  getShortText,
} from "../../utils/Helper";
import CalendarPicker, {
  formatDatePicker,
  formatTime,
} from "../../components/CalenderPicker";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store";
import {
  clearTaskError,
  createPrivateTask,
  createProjectTask,
} from "../../store/slices/TaskSlice";
import { PriorityLevel } from "../../store/slices/types";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import {
  DESC_LENGTH,
  HEADER_LENGTH,
  isDisplayErrorMessageAtom,
} from "../../utils/Constent";
import { PRIORITIES } from "../utils/screen.utils";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { updateUserStats } from "../../store/slices/authSlice";
import { onUpdateGlobalStateForProject } from "../../utils/GlobalStateUpdateUtils";

export type TaskType = "PROJECT" | "PRIVATE";

export interface ProjectDetails {
  id: string;
  name: string;
  category?: string;
  memberCount?: number;
  isActive?: boolean;
}

export interface CreateTaskForm {
  taskHeader: string;
  taskDesc: string;
  priority: PriorityLevel;
  taskDeadline: Date;
}

function SectionHeader({
  iconName,
  title,
  required,
  titleSize,
  iconSize,
  iconBoxSize,
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
    </HStack>
  );
}

export default function CreateTaskScreen() {
  type createTaskRoute = RouteProp<RouteStackParamStack, "CreateTaskScreen">;

  const route = useRoute<createTaskRoute>();
  const { onBack, taskType, project } = route.params;

  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  const dispatch = useDispatch<AppDispatch>();
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.width;

  const fs = {
    heroTitle: adjustSizeToResolveZoomInIssue(baseSize * 0.07),
    heroSub: adjustSizeToResolveZoomInIssue(baseSize * 0.036),
    sectionTitle: adjustSizeToResolveZoomInIssue(baseSize * 0.041),
    sectionSub: adjustSizeToResolveZoomInIssue(baseSize * 0.031),
    sectionIcon: adjustSizeToResolveZoomInIssue(baseSize * 0.041),
    input: adjustSizeToResolveZoomInIssue(baseSize * 0.036),
    charCount: adjustSizeToResolveZoomInIssue(baseSize * 0.031),
    badge: adjustSizeToResolveZoomInIssue(baseSize * 0.03),
    priorityName: adjustSizeToResolveZoomInIssue(baseSize * 0.032),
    priorityIcon: adjustSizeToResolveZoomInIssue(baseSize * 0.036),
    cta: adjustSizeToResolveZoomInIssue(baseSize * 0.041),
    ctaHint: adjustSizeToResolveZoomInIssue(baseSize * 0.031),
  };

  const iconBoxSize = baseSize * 0.1;
  const illustrationSz = baseSize * 0.25;
  const priorityCardW = adjustSizeToResolveZoomInIssue(baseSize * 0.19);

  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isProject = taskType === "PROJECT";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    defaultValues: {
      taskHeader: "",
      taskDesc: "",
      priority: "LOW",
      taskDeadline: new Date(new Date().getTime() + 60 * 60 * 1000),
    },
  });

  const onHandleSubmit = async (data: CreateTaskForm) => {
    setIsLoading(true);
    try {
      if (taskType == "TASK") {
        await dispatch(createPrivateTask(data)).unwrap();
        dispatch(updateUserStats({ tasksCount: 1 }));
      } else {
        await dispatch(
          createProjectTask({ projectId: project!.projectId, ...data }),
        ).unwrap();
      await onUpdateGlobalStateForProject({entity : "TASK" ,action : "CREATE"})
      }
      navigation.goBack();
    } catch (err: any) {
      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Couldn't create task",
        subtitle:
          typeof err === "string"
            ? err
            : (err?.message ??
              "Something went wrong while creating the task. Please try again."),
        onClickLeftButton: () => {
          dispatch(clearTaskError());
          navigation?.goBack?.();
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
            top={getInsetTop() * 1.2}
            zIndex={2}
          >
            <Pressable
              onPress={onBack}
              w={adjustSizeToResolveZoomInIssue(baseSize * 0.12)}
              h={adjustSizeToResolveZoomInIssue(baseSize * 0.12)}
              rounded="full"
              bg="coolGray.100"
              alignItems="center"
              shadow={1}
              justifyContent="center"
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
                  <VStack flex={1} mr={3}>
                    <Text
                      fontSize={fs.heroTitle}
                      fontWeight="800"
                      color="#1A1A2E"
                      lineHeight={fs.heroTitle * 1.22}
                    >
                      {"Create Task"}
                    </Text>
                    <Text
                      fontSize={fs.heroSub}
                      color="#757575"
                      mt={1}
                      lineHeight={fs.heroSub * 1.55}
                    >
                      {isProject
                        ? "Add a new task to this project\nand get things done."
                        : "Add a new personal task and\nstay organized."}
                    </Text>
                  </VStack>
                  <Box
                    w={illustrationSz}
                    h={illustrationSz}
                    borderRadius="2xl"
                    bg="#5B3FFF"
                    alignItems="center"
                    justifyContent="center"
                    mt={1}
                    style={{
                      elevation: 6,
                      shadowColor: "#5B3FFF",
                      shadowOpacity: 0.35,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 6 },
                    }}
                  >
                    <Icon
                      as={MaterialIcons}
                      name={"post-add"}
                      size={illustrationSz * 0.48}
                      color="white"
                    />
                    <Box
                      position="absolute"
                      bottom={-8}
                      right={-8}
                      w={illustrationSz * 0.28}
                      h={illustrationSz * 0.28}
                      borderRadius="full"
                      bg="white"
                      alignItems="center"
                      justifyContent="center"
                      style={{ elevation: 3 }}
                    >
                      <Icon
                        as={isProject ? Octicons : Ionicons}
                        name={isProject ? "project" : "person"}
                        size={illustrationSz * 0.15}
                        color="#5B3FFF"
                      />
                    </Box>
                  </Box>
                </HStack>
              </Box>

              {isProject && project && (
                <Box
                  mx="4%"
                  mb={3}
                  bg="white"
                  borderRadius="2xl"
                  px="4%"
                  py={3}
                  style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Text
                    fontSize={fs.sectionSub}
                    color="#9E9E9E"
                    mb={2}
                    fontWeight="500"
                  >
                    Project
                  </Text>
                  <HStack alignItems="center" space={3}>
                    <Box
                      w={iconBoxSize * 1.1}
                      h={iconBoxSize * 1.1}
                      borderRadius="lg"
                      bg="#EDE7F6"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        as={Feather}
                        name="grid"
                        size={fs.sectionIcon}
                        color="#5B3FFF"
                      />
                    </Box>
                    <VStack flex={1}>
                      <Text
                        fontSize={fs.sectionTitle}
                        fontWeight="700"
                        color="#1A1A2E"
                      >
                        {getShortText(project.projectHeader, 50)}
                      </Text>
                    </VStack>
                    <VStack alignItems="flex-end" space={1}>
                      {project.membersCount !== undefined && (
                        <HStack alignItems="center" space={1}>
                          <Icon
                            as={Ionicons}
                            name="people-outline"
                            size={fs.badge}
                            color="#9E9E9E"
                          />
                          <Text fontSize={fs.badge} color="#9E9E9E">
                            {project.membersCount} Members
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              )}

              {!isProject && (
                <Box
                  mx="4%"
                  mb={3}
                  bg="white"
                  borderRadius="2xl"
                  px="4%"
                  py={3}
                  style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <HStack alignItems="center" space={3}>
                    <Box
                      w={iconBoxSize * 1.1}
                      h={iconBoxSize * 1.1}
                      borderRadius="lg"
                      bg="#EDE7F6"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        as={Ionicons}
                        name="person-outline"
                        size={fs.sectionIcon}
                        color="#5B3FFF"
                      />
                    </Box>
                    <VStack flex={1}>
                      <Text
                        fontSize={fs.sectionTitle}
                        fontWeight="700"
                        color="#1A1A2E"
                      >
                        Personal Task
                      </Text>
                      <Text fontSize={fs.sectionSub} color="#9E9E9E" mt={0.5}>
                        This task is private and visible only to you.{"\n"}It is
                        not linked to any project.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

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
                  name="taskHeader"
                  rules={{ required: "Task header is required" }}
                  render={({ field: { onChange, value } }) => (
                    <FormControl isRequired isInvalid={!!errors.taskHeader}>
                      <SectionHeader
                        required
                        iconName="type"
                        title="Task Header"
                        titleSize={fs.sectionTitle}
                        iconSize={fs.sectionIcon}
                        iconBoxSize={iconBoxSize}
                      />
                      <Box
                        borderWidth={1}
                        borderColor={errors.taskHeader ? "#C62828" : "#E0E0E0"}
                        borderRadius="xl"
                        px={3}
                        py={2}
                      >
                        <TextInput
                          style={{
                            fontSize: fs.input,
                            color: "#1A1A2E",
                            paddingVertical: 2,
                            textAlignVertical: "top",
                          }}
                          placeholder="Enter task title"
                          placeholderTextColor="#BDBDBD"
                          value={value}
                          onChangeText={onChange}
                          multiline
                          maxLength={HEADER_LENGTH}
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
                        {errors.taskHeader?.message}
                      </FormControl.ErrorMessage>
                    </FormControl>
                  )}
                />

                <Box h="1px" bg="#F5F5F5" my={4} />

                <Controller
                  control={control}
                  name="taskDesc"
                  rules={{ required: "Task description is required" }}
                  render={({ field: { onChange, value } }) => (
                    <FormControl isRequired isInvalid={!!errors.taskDesc}>
                      <SectionHeader
                        required
                        iconName="align-left"
                        title="Task Description"
                        titleSize={fs.sectionTitle}
                        iconSize={fs.sectionIcon}
                        iconBoxSize={iconBoxSize}
                      />
                      <Box
                        borderWidth={1}
                        borderColor={errors.taskDesc ? "#C62828" : "#E0E0E0"}
                        borderRadius="xl"
                        px={3}
                        pt={2}
                        pb={1}
                      >
                        <TextInput
                          style={{
                            fontSize: fs.input,
                            color: "#1A1A2E",
                            minHeight: baseSize * 0.26,
                            paddingVertical: 4,
                            textAlignVertical: "top",
                          }}
                          placeholder="Describe the task details..."
                          placeholderTextColor="#BDBDBD"
                          value={value}
                          onChangeText={onChange}
                          maxLength={DESC_LENGTH}
                          multiline
                          numberOfLines={5}
                        />
                        <Text
                          fontSize={fs.charCount}
                          color="#BDBDBD"
                          textAlign="right"
                          mb={1}
                        >
                          {value.length} / {DESC_LENGTH}
                        </Text>
                      </Box>
                      <FormControl.ErrorMessage
                        leftIcon={<WarningOutlineIcon size="xs" />}
                      >
                        {errors.taskDesc?.message}
                      </FormControl.ErrorMessage>
                    </FormControl>
                  )}
                />

                <Box h="1px" bg="#F5F5F5" my={4} />

                <Controller
                  control={control}
                  name="taskDeadline"
                  rules={{
                    validate: (date) =>
                      date > new Date() || "Deadline cannot be in the past.",
                  }}
                  render={({ field: { value, onChange } }) => (
                    <FormControl isRequired isInvalid={!!errors.taskDeadline}>
                      <SectionHeader
                        required
                        iconName="calendar"
                        title="Task Deadline"
                        titleSize={fs.sectionTitle}
                        iconSize={fs.sectionIcon}
                        iconBoxSize={iconBoxSize}
                      />
                      <Pressable
                        onPress={() => setShowCalendar((v) => !v)}
                        borderWidth={1.5}
                        borderColor={
                          errors.taskDeadline ? "#C62828" : "#5B3FFF"
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
                        {errors.taskDeadline?.message}
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

                <Box h="1px" bg="#F5F5F5" my={4} />

                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { value, onChange } }) => (
                    <FormControl>
                      <SectionHeader
                        required
                        iconName="flag"
                        title="Priority Level"
                        titleSize={fs.sectionTitle}
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
                              px={1}
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
                    </FormControl>
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
                        as={MaterialIcons}
                        name={"post-add"}
                        size={illustrationSz * 0.3}
                        color="white"
                      />
                      <Text
                        fontSize={fs.cta}
                        fontWeight="700"
                        color="white"
                        letterSpacing={0.3}
                      >
                        Create Task
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
