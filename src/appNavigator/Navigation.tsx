import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import { RootState, AppDispatch } from "../store";
import { loadUser } from "../store/slices/authSlice";

import AuthScreen from "../screens/auth/AuthScreen";
import LoginScreen from "../screens/auth/LoginPage";
import SignupScreen from "../screens/auth/RegisterPage";
import { Center } from "native-base";
import ProjectDetailScreen from "../screens/projects/ProjectDetailScreen";
import TaskDetailScreen from "../screens/tasks/DisplayTaskDetails";
import NewHomeScreen from "../screens/HomeScreen/NewHomeScreen";
import CreateProjectScreen from "../screens/projects/CreateProjects";
import CreateTaskScreen from "../screens/tasks/CreateTasks";
import ProjectTaskList from "../screens/tasks/ProjectTaskList";
import MessageListScreen from "../screens/message/MessageListScreen";
import AppLoader from "../components/CustomLoader";

const Stack = createNativeStackNavigator();

const ApplicationNavigation = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { isAuthenticated, isCheckLoadUser } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    dispatch(loadUser());
  }, []);

  // 🔥 Show loader while checking token
  if (!isCheckLoadUser) {
    return (
      <Center flex={1}>
        <AppLoader isLoading={!isCheckLoadUser} fullScreen />
      </Center>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {/* ✅ PRIVATE SCREENS */}
            <Stack.Screen name="HomeScreen" component={NewHomeScreen} />
            <Stack.Screen
              name="CreateProjectScreen"
              component={CreateProjectScreen}
            />
            <Stack.Screen
              name="CreateTaskScreen"
              component={CreateTaskScreen}
            />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
            />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
            <Stack.Screen name="ProjectTaskList" component={ProjectTaskList} />
            <Stack.Screen
              name="MessageListScreen"
              component={MessageListScreen}
            />
          </>
        ) : (
          <>
            {/* ✅ AUTH SCREENS */}
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SignupScreen" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default ApplicationNavigation;
