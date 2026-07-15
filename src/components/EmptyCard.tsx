import { Box, Pressable, Text } from "native-base";

export const EmptyCard = ({ text, actionText, onPress }: any) => (
  <Box bg="white" p={6} borderRadius="2xl" alignItems="center">
    <Text color="coolGray.400">{text}</Text>

    {actionText && (
      <Pressable
        mt={4}
        bg="red.500"
        px={5}
        py={3}
        borderRadius="xl"
        onPress={onPress}
      >
        <Text color="white" fontWeight="bold">
          {actionText}
        </Text>
      </Pressable>
    )}
  </Box>
);
