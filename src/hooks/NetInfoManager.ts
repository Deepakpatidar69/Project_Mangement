// hooks/useNetworkManager.js
import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useSetAtom } from "jotai";
import { isOnlineAtom } from "../utils/Constent";

export const useNetworkManager = () => {
  const setIsOnline = useSetAtom(isOnlineAtom);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null initially, so we check explicitly for !== false
      const connected =
        state.isConnected && state.isInternetReachable !== false || false;
      setIsOnline(connected);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setIsOnline]);
};
