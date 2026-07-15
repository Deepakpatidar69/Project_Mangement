import { useAtom, useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import {
  AppLoaderAtom,
  displayAddMemberModalAtom,
  DisplayCommonModalPopUpAtom,
  displayMessageModalAtom,
  globalMenuAtom,
  isDeadlineUpdateModalAtom,
  isDisplayDeleteModalPopUpAtom,
  isDisplayErrorMessageAtom,
  isOnlineAtom,
  isPriorityUpdateModalAtom,
  isUpdateMemberRoleModalAtom,
} from "../../utils/Constent";
import SendMessageModal from "../../modals/MessageModal";
import { getScreenDimensions } from "../../utils/Helper";
import { Box, Pressable, View } from "native-base";
import AddMemberModal from "../../modals/AddMemberModal";
import { commonModalDefaultProps, ErrorModalDefaultProps } from "../../utils/AppDefaultProps";
import CommonModel, { commonModalProps } from "../../modals/CommonModel";
import UpdateDeadlineModal from "../../modals/UpdateDeadlineModal";
import UpdatePriorityModal from "../../modals/UpdatePriorityModal";
import { FloatingActionMenu } from "../../modals/ActionManu";
import AppLoader from "../../components/CustomLoader";
import UpdateRoleModal from "../../modals/UpdateMemberRole";
import { getAssets } from "../../AssetsMapping/AssetMap";
import OfflineModal from "../../modals/OfflineModal";

type AppComponentProps = {
  children: React.ReactNode;
};

export const AppContainer = ({ children }: AppComponentProps) => {
  const messageAtom = useAtomValue(displayMessageModalAtom);
  const addMemberAtom = useAtomValue(displayAddMemberModalAtom);

  const [menuState, setMenuState] = useAtom(globalMenuAtom);

  const handleClose = () => {
    setMenuState((prev) => ({ ...prev, isOpen: false }));
  };

  const [isDeadlinePopUpDisplay, setIsDeadlimePopUpDisplay] = useAtom(
    isDeadlineUpdateModalAtom,
  );
  const [isDisplayErrorPopUp, setIsDisplayErrorPopUp] = useAtom(
    isDisplayErrorMessageAtom,
  );

  const [isCommonPopUpDisplay, setIsCommonPopUpDisplay] =
    useState<boolean>(false);

  const [commonPopUpContentDecider, setcommonPopUpContentDecider] =
    useState<commonModalProps>(commonModalDefaultProps);

  const [isDisplayDeleteModalAtom, setIsDisplayDeleteModalAtom] = useAtom(
    isDisplayDeleteModalPopUpAtom,
  );
  const [isDisplayCommonModalAtom, setIsDisplayCommonModalAtom] = useAtom(
    DisplayCommonModalPopUpAtom,
  );

  const [isDisplayPriorityUpdateModal, setIsDisplayPriorityUpdateModal] =
    useAtom(isPriorityUpdateModalAtom);

  const [isDisplayMemberRoleModal, setIsDisplayMemberRoleModal] = useAtom(
    isUpdateMemberRoleModalAtom,
  );

  const [isUserOffline, setIsUserOffline] = useState<boolean>(false);
  const [isUserOnline, setIsOnlineAtom] = useAtom(isOnlineAtom);

  const { screenHeight, screenWidth } = getScreenDimensions();

  const isDisplayAppLoader = useAtomValue(AppLoaderAtom);

  const onHandleCloseCommonPopUp = () => {
    setIsCommonPopUpDisplay(false);
    setcommonPopUpContentDecider(commonModalDefaultProps);
  };

  const commonPopupConfigs = [
    {
      atom: isDisplayCommonModalAtom,
      getConfig: (): commonModalProps => ({
        isModalOpen: true,
        compoHeight: screenHeight * 0.4,
        compoWidth: screenWidth * 0.9,
        title: isDisplayCommonModalAtom.title,
        subTitle: isDisplayCommonModalAtom.subTitle,
        note: isDisplayCommonModalAtom.note,
        isShowBothButton: true,
        leftButtonText: isDisplayCommonModalAtom.leftButtonText ?? "Cancel",
        rightButtonText: isDisplayCommonModalAtom.rightButtonText,
        img: isDisplayCommonModalAtom?.img,
        onClickLeftButton: () => {
          isDisplayCommonModalAtom?.onClickLeftButton();
          setIsDisplayDeleteModalAtom(commonModalDefaultProps);
          onHandleCloseCommonPopUp();
        },
        onClickRightButton: () => {
          isDisplayCommonModalAtom?.onClickRightButton?.();
          onHandleCloseCommonPopUp();
        },

        padding: 0.06,
        fontSizeMultiplier: {
          titleTextSize: 0.06,
          subTitleTextSize: 0.045,
          buttonTextSize: 0.05,
          noteTextSize: 0.035,
          borderRadius: 0.035,
          imgSize: 0.18,
        },
        colorConfig: {
          noteTextColor: "red.400",
          ...isDisplayCommonModalAtom.colorConfig,
        },
      }),
    },

    {
      atom: isDisplayErrorPopUp,
      getConfig: (): commonModalProps => ({
        isModalOpen: true,
        compoHeight: screenHeight * 0.4,
        compoWidth: screenWidth * 0.85,
        title: isDisplayErrorPopUp.title,
        subTitle: isDisplayErrorPopUp.subTitle,
        note: isDisplayErrorPopUp.note,
        isShowBothButton: false,
        leftButtonText: isDisplayErrorPopUp.leftButtonText ?? "Cancel",
        rightButtonText: isDisplayErrorPopUp.rightButtonText,
        img: isDisplayErrorPopUp?.img ?? getAssets("WARNING_ICON"),
        onClickLeftButton: () => {
          isDisplayErrorPopUp?.onClickLeftButton();
          setIsDisplayErrorPopUp(ErrorModalDefaultProps);
          onHandleCloseCommonPopUp();
        },

        padding: 0.06,
        fontSizeMultiplier: {
          titleTextSize: 0.06,
          subTitleTextSize: 0.05,
          buttonTextSize: 0.06,
          noteTextSize: 0.035,
          borderRadius: 0.045,
          imgSize: 0.28,
        },
        colorConfig: {
          titleColor: "red.500",
          subTitleColor: "red.400",
          ...isDisplayCommonModalAtom.colorConfig,
        },
      }),
    },
  ];

  useEffect(() => {
    if (
      isCommonPopUpDisplay ||
      messageAtom.isDisplayMessageModal ||
      addMemberAtom.isDisplay
    ) {
      console.log(
        `the isCommonPopUpDisplay is already displayed :: ${isCommonPopUpDisplay} `,
      );

      return;
    }

    const activePopup = commonPopupConfigs.find((p) => p.atom.isModalOpen);

    if (activePopup) {
      const atomConfiguration = activePopup.getConfig();
      setcommonPopUpContentDecider(atomConfiguration);
      setIsCommonPopUpDisplay(true);
    }
  }, [isDisplayDeleteModalAtom, isDisplayCommonModalAtom, isDisplayErrorPopUp]);

  useEffect(() => {
    !isUserOnline ? setIsUserOffline(true) : setIsUserOffline(false);
  }, [isUserOnline]);

  return (
    <View style={{ flex: 1 }}>
      {/* Main App Content */}
      <Box w={"100%"} height={"100%"}>
        {children}
      </Box>
      {/**
       * -------------------------------------------------------------------------------------
       * -------------------------------- For Message Pop Up ----------------------------------
       * -------------------------------------------------------------------------------------
       */}
      {messageAtom.isDisplayMessageModal && (
        <Box
          position={"absolute"}
          width={"100%"}
          height={"100%"}
          zIndex={1000}
          justifyContent={"center"}
          alignItems={"center"}
          bg={"transparent"}
        >
          <SendMessageModal
            compHeight={screenHeight * 0.5}
            compWidth={screenWidth * 0.9}
            dueDate={messageAtom.dueDate ?? new Date()}
            isOpen={messageAtom.isDisplayMessageModal}
            onClose={messageAtom.onTapCancel!}
            status={messageAtom.status}
            title={messageAtom.title}
            type={messageAtom.type!}
            uniqueId={messageAtom.uniqueId}
            backdropColor={messageAtom.backdropColor}
            backgroundColor={messageAtom.backgroundColor}
            onHandleSendMessage={messageAtom.onTapSendMessage!}
          />
        </Box>
      )}

      {/**
       * -------------------------------------------------------------------------------------
       * -------------------------------- For Add Member Pop Up ------------------------------
       * -------------------------------------------------------------------------------------
       */}
      {addMemberAtom.isDisplay && (
        <Box
          position={"absolute"}
          width={"100%"}
          height={"100%"}
          zIndex={1000}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <AddMemberModal
            compHeight={screenHeight * 0.5}
            compWidth={screenWidth * 0.9}
            isOpen={addMemberAtom.isDisplay}
            onClose={addMemberAtom.onClose}
            onSuccess={addMemberAtom.onSuccess}
            projectId={addMemberAtom.projectId}
          />
        </Box>
      )}
      {/**
       * -------------------------------------------------------------------------------------
       * -------------------------------- For Common Pop Up ----------------------------------
       * -------------------------------------------------------------------------------------
       */}
      {commonPopUpContentDecider.isModalOpen && (
        <Box
          position={"absolute"}
          width={"100%"}
          height={"100%"}
          zIndex={1000}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <CommonModel
            isModalOpen={commonPopUpContentDecider.isModalOpen}
            compoHeight={commonPopUpContentDecider.compoHeight}
            compoWidth={commonPopUpContentDecider.compoWidth}
            leftButtonText={
              commonPopUpContentDecider.leftButtonText ?? "Cancel"
            }
            subTitle={commonPopUpContentDecider.subTitle}
            title={commonPopUpContentDecider.title}
            img={commonPopUpContentDecider.img}
            isShowBothButton={commonPopUpContentDecider.isShowBothButton}
            onClickLeftButton={commonPopUpContentDecider.onClickLeftButton}
            onClickRightButton={commonPopUpContentDecider.onClickRightButton}
            note={commonPopUpContentDecider.note}
            rightButtonText={commonPopUpContentDecider.rightButtonText}
            padding={commonPopUpContentDecider.padding}
            fontSizeMultiplier={commonPopUpContentDecider.fontSizeMultiplier}
            colorConfig={commonPopUpContentDecider.colorConfig}
          />
        </Box>
      )}
      {/**
       * -------------------------------------------------------------------------------------
       * ---------------------------- For Update Deadline Pop Up -----------------------------
       * -------------------------------------------------------------------------------------
       */}
      {isDeadlinePopUpDisplay.isModalOpen && (
        <Box
          position={"absolute"}
          width={"100%"}
          height={"100%"}
          zIndex={1000}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <UpdateDeadlineModal
            compoHeight={screenHeight * 0.8}
            compoWidth={screenWidth * 0.9}
            isModalOpen={true}
            onClose={isDeadlinePopUpDisplay.onClose}
            type={isDeadlinePopUpDisplay.type}
            onSuccess={isDeadlinePopUpDisplay.onSuccess}
            currentDeadline={isDeadlinePopUpDisplay.currentDeadline}
            uniqueId={isDeadlinePopUpDisplay.uniqueId}
          />
        </Box>
      )}
      {/**
       * -------------------------------------------------------------------------------------
       * ---------------------------- For Update Priority Pop Up -----------------------------
       * -------------------------------------------------------------------------------------
       */}

      {isDisplayPriorityUpdateModal.isModalOpen && (
        <Box
          position={"absolute"}
          width={"100%"}
          height={"100%"}
          zIndex={1000}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <UpdatePriorityModal
            compoHeight={screenHeight * 0.5}
            compoWidth={screenWidth * 0.9}
            isModalOpen={true}
            onClose={isDisplayPriorityUpdateModal.onClose}
            type={isDisplayPriorityUpdateModal.type}
            currentPriority={isDisplayPriorityUpdateModal.currentPriority}
            onSuccess={isDisplayPriorityUpdateModal.onSuccess}
          />
        </Box>
      )}
      {/**
       * -------------------------------------------------------------------------------------
       * ---------------------------- For Update Member Role Pop Up -----------------------------
       * -------------------------------------------------------------------------------------
       */}

      {isDisplayMemberRoleModal.isModalOpen && (
        <Box
          position={"absolute"}
          width={"100%"}
          height={"100%"}
          zIndex={1000}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <UpdateRoleModal
            compoHeight={screenHeight * 0.5}
            compoWidth={screenWidth * 0.9}
            isModalOpen={true}
            onClose={isDisplayMemberRoleModal.onClose}
            currentRole={isDisplayMemberRoleModal.currentRole}
            onSuccess={isDisplayMemberRoleModal.onSuccess}
          />
        </Box>
      )}

      {/**
       * -------------------------------------------------------------------------------------
       * ---------------------------- For Display Floting Menu -----------------------------
       * -------------------------------------------------------------------------------------
       */}

      {menuState.isOpen && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={9999}
        >
          {/* Invisible backdrop to close the menu when clicking anywhere else */}
          <Pressable style={{ flex: 1 }} onPress={handleClose} />

          <Box
            position="absolute"
            top={menuState.y}
            right={screenWidth - (menuState.x + menuState.iconWidth)}
          >
            <FloatingActionMenu
              isOpen={menuState.isOpen}
              onClose={handleClose}
              options={menuState.options}
              minWidth={menuState.minWidth}
            />
          </Box>
        </Box>
      )}

      {/**
       * -------------------------------------------------------------------------------------
       * ---------------------------- For Display App Loader ------------------------------
       * -------------------------------------------------------------------------------------
       */}

      {isDisplayAppLoader.isLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={9999}
        >
          <AppLoader
            isLoading={isDisplayAppLoader.isLoading}
            fullScreen
            message={isDisplayAppLoader.message}
          />
        </Box>
      )}

      {/**
       * -------------------------------------------------------------------------------------
       * ---------------------------- For Display Offline Modal ------------------------------
       * -------------------------------------------------------------------------------------
       */}

      {isUserOffline && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={9999}
        >
          <OfflineModal
            isOpen={true}
            compHeight={screenHeight * 0.4}
            compWidth={screenWidth * 0.9}
            onClose={() => setIsUserOffline(true)}
            lottieSource={"Offline"}
            title="You're Offline"
            message="Please check your internet connection and try again."
          />
        </Box>
      )}
    </View>
  );
};
