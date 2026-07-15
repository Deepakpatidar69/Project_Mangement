import { HStack, Text } from "native-base";
import { Pressable } from "react-native";

export const SectionHeader = ({ title, onViewAll, showViewAll }: any) => (
  <HStack justifyContent="space-between" mt={6} mb={2}>
    <Text fontWeight="bold">{title}</Text>
    {showViewAll && (
      <Pressable onPress={onViewAll}>
        <Text color="blue.500">View All →</Text>
      </Pressable>
    )}
  </HStack>
);
