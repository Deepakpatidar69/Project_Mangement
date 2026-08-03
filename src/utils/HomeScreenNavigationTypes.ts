import {
  FontAwesome,
  Ionicons,
  MaterialIcons,
  // @ts-ignore - no declaration file for react-native-vector-icons
} from "react-native-vector-icons";

export const HomeScreenNavigationType = [
  {
    id: 1,
    name: "Home",
    label: "Home",
    route: "HomeScreen",
    screen: "DASHBOARD_SCREEN",
    icon: "home-outline",
    activeIcon: "home",

    iconType: Ionicons,
  },

  {
    id: 2,
    name: "Tasks",
    label: "Tasks",
    route: "AllTasksScreen",
    screen: "PRIVATE_TASK_SCREEN",
    icon: "tasks",
    activeIcon: "tasks",
    iconType: FontAwesome,
  },

  {
    id: 3,
    name: "Add",
    label: "Add",
    icon: "add",
    activeIcon: "add",
    isCenterButton: true,
    iconType: Ionicons,

    subActions: [
      {
        label: "Task",
        route: "CreateTaskScreen",
        screenType: "CREATE_TASK_SCREEN",
        icon: "post-add",
        iconType: MaterialIcons,
      },
      {
        label: "Project",
        route: "CreateProjectScreen",
        screenType: "CREATE_PROJECT",
        icon: "folder-open",
        iconType: Ionicons,
      },
    ],
  },

  {
    id: 4,
    name: "Projects",
    label: "Projects",
    route: "AllProjectScreen",
    screen: "PROJECT_SCREEN",
    icon: "folder-outline",
    activeIcon: "folder",

    iconType: Ionicons,
  },

  {
    id: 5,
    name: "Profile",
    label: "Profile",
    route: "ProfileScreen",
    screen: "PROFILE_SCREEN",
    icon: "person-outline",
    activeIcon: "person",

    iconType: Ionicons,
  },
];
