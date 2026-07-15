// @ts-ignore - no declaration file for react-native-vector-icons
import { Ionicons } from "react-native-vector-icons";
import { Box, Pressable, Text } from "native-base";

const ActionCard = ({ icon, label, color, onPress }: any) => {
  return (
    <Pressable flex={1} onPress={onPress}>
      <Box bg="white" p={4} borderRadius="xl" alignItems="center" shadow={2}>
        <Box bg={color} p={3} borderRadius="full" mb={2}>
          <Ionicons name={icon} size={20} color="white" />
        </Box>

        <Text fontSize="sm" fontWeight="600">
          {label}
        </Text>
      </Box>
    </Pressable>
  );
};

export default ActionCard;
