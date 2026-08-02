import React from "react";
import { Box, VStack, Button, Text, Center } from "native-base";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function AuthScreen({ navigation }: any) {
  // const dispatch = useDispatch<AppDispatch>();

  // const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // /** 🔥 Auto login check */
  // useEffect(() => {
  //   dispatch(loadUser());
  // }, []);

  // /** 🔥 Redirect if already logged in */
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     navigation.replace("HomeScreen");
  //   }
  // }, [isAuthenticated]);

  return (
   <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      <Box flex={1} bg="primary.600" px={6}>
        <Center flex={1}>
          <VStack space={10} w="100%" alignItems="center">
            {/* 🔥 APP NAME */}
            <VStack space={2} alignItems="center">
              <Text fontSize="4xl" fontWeight="bold" color="white">
                TaskFlow 🚀
              </Text>

              <Text color="coolGray.200" textAlign="center">
                Manage your tasks, projects & team easily
              </Text>
            </VStack>

            {/* 🔥 BUTTONS */}
            <VStack space={4} w="100%">
              <Button
                bg="black"
                size="lg"
                onPress={() => navigation.navigate("LoginScreen")}
              >
                Login
              </Button>

              <Button
                variant="outline"
                borderColor="white"
                _text={{ color: "white" }}
                size="lg"
                onPress={() => navigation.navigate("SignupScreen")}
              >
                Sign Up
              </Button>
            </VStack>
          </VStack>
        </Center>
      </Box>
    </KeyboardAwareScrollView>
  );
}
