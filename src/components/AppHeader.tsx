import React from "react";

import {
  Box,
  HStack,
  Text,
  IconButton,
  VStack,
  Avatar,
  Pressable,
} from "native-base";
import { AuthProps } from "../store/slices/types";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";

type Props = {
  title: string;

  subtitle?: string;

  user: AuthProps;

  onTapProfile: () => void;

  continerDimention: { height: number; width: number; baseSize: number };
};

export default function AppHeader({
  continerDimention,
  user,
  title,
  subtitle,
  onTapProfile,
}: Props) {
  console.log(`Container Dmension is :: ${JSON.stringify(continerDimention)}`);

  return (
    continerDimention.baseSize > 0 && (
      <Box width={continerDimention.width} height={continerDimention.height} >
        <HStack
          width={"100%"}
          height={"100%"}
          justifyContent="space-between"
          alignItems="center"
        >
          <VStack flex={1} justifyContent={"center"} alignItems={"flex-start"}>
            <Text
              fontSize={adjustSizeToResolveZoomInIssue(
                continerDimention.baseSize * 0.3,
              )}
              fontWeight="bold"
              color="black"
            >
              {title}
            </Text>
            <Text
              fontSize={adjustSizeToResolveZoomInIssue(
                continerDimention.baseSize * 0.15,
              )}
              color="gray.500"
              mt={1}
            >
              {subtitle}
            </Text>
          </VStack>

          <HStack justifyContent={"center"} alignItems="center">
            {/* <Box
          w={10}
          h={10}
          bg="white"
          rounded="full"
          justifyContent="center"
          alignItems="center"
          shadow={1}
        >
          <Text fontSize="lg">🔔</Text>
        </Box> */}
            <Pressable onPress={onTapProfile}>
              <Avatar
                bg="indigo.500"
                source={{
                  uri:
                    user?.profileImage?.url ||
                    `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=fff&size=150`,
                }}
                size={adjustSizeToResolveZoomInIssue(
                  continerDimention.baseSize * 0.6,
                )}
              />
            </Pressable>
          </HStack>
        </HStack>
      </Box>
    )
  );
}
