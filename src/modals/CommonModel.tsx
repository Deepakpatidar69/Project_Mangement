import { Box, VStack, HStack, Text, Image, Pressable } from "native-base";
import React from "react";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";

export type commonModalProps = {
  /** Controls whether the modal is visible */
  isModalOpen: boolean;

  /** Background overlay color behind the modal
   * @default "rgba(0,0,0,0.2)"
   */
  backDropColor?: string;

  /** Height of the modal container
   * @default 100
   */
  compoHeight?: number;

  /** Width of the modal container
   *  @default 100
   */
  compoWidth?: number;

  /** Main heading displayed in the modal */
  title: string;

  /** Supporting message shown below the title */
  subTitle: string;

  /** Determines whether both action buttons are shown
   * If false, only the left button is rendered.
   * @default true
   */
  isShowBothButton?: boolean;

  /** Text displayed on the left (secondary) button */
  leftButtonText: string;

  /** Text displayed on the right (primary) button */
  rightButtonText?: string;

  /** Optional note displayed below the buttons */
  note?: string;

  /** Callback executed when the left button is pressed */
  onClickLeftButton: () => void;

  /** Callback executed when the right button is pressed */
  onClickRightButton?: () => void;

  /** Icon image shown at the top of the modal */
  img?: any;

  /** outer padding of the model (applied as both px and py — i.e. on all
   * four sides). Section heights are calculated AFTER subtracting this
   * padding from compoHeight on both the top and bottom edges, so the
   * sections never overflow the padded content area.
   * @default 0.08
   */
  padding?: number;

  /**
   * Multipliers used to calculate sizes based on `compoHeight`.
   */
  fontSizeMultiplier?: {
    /** Multiplier for the title text size
     * @default 0.05
     */
    titleTextSize?: number;

    /** Multiplier for the subtitle text size
     * @default 0.045
     */
    subTitleTextSize?: number;

    /** Multiplier for the note text size
     * @default 0.032
     */
    noteTextSize?: number;

    /** Multiplier for button text size
     * @default 0.04
     */
    buttonTextSize?: number;

    /** Multiplier for the modal border radius
     * @default 0.04
     */
    borderRadius?: number;

    /** Multiplier for the icon size
     * @default 0.16
     */
    imgSize?: number;
  };

  /**
   * Relative weights used to divide the USABLE height (compoHeight minus
   * top+bottom padding) among each section (img, title, subTitle, buttons,
   * note). Each section's rendered height = (its weight / sum of weights
   * of sections actually present) * usableHeight.
   *
   * title and subTitle are mandatory and always included in the pool. img
   * and note only join the pool when their content is provided (`img` /
   * `note` props are set) — when either is absent, its weight is excluded
   * from the sum, so the remaining sections grow to fill that freed height
   * proportionally instead of leaving a gap.
   */
  heightWeights?: {
    /** Weight for the icon section
     * @default 0.28
     */
    img?: number;

    /** Weight for the title section
     * @default 0.15
     */
    title?: number;

    /** Weight for the subtitle section
     * @default 0.27
     */
    subTitle?: number;

    /** Weight for the buttons row
     * @default 0.15
     */
    buttons?: number;

    /** Weight for the note section
     * @default 0.15
     */
    note?: number;
  };

  /**
   * Custom color configuration for the modal.
   */
  colorConfig?: {
    /** Background color of the modal
     * @default "white"
     */
    bgColor?: string;

    /** Color of the title text
     * @default "coolGray.900"
     */
    titleColor?: string;

    /** Color of the subtitle text
     * @default "coolGray.500"
     */
    subTitleColor?: string;

    /** Color of the note text
     * @default "coolGray.400"
     */
    noteTextColor?: string;

    /** Color of the left button text
     * @default "coolGray.700"
     */
    leftButtonTextColor?: string;

    /** Color of the right button text
     * @default "white"
     */
    rightButtonTextColor?: string;

    /** Background color of the left button
     * @default "coolGray.100"
     */
    leftButtonBgColor?: string;

    /** Background color of the _press left button
     * @default "coolGray.300"
     */
    onPressLeftButtonBgColor?: string;

    /** Background color of the right button
     * @default "indigo.500"
     */
    rightButtonBgColor?: string;
    /** Background color of the _press right button
     * @default "indigo.700"
     */
    onPressRightButtonBgColor?: string;
  };
};

export const CommonModel = ({
  isModalOpen,
  backDropColor,
  colorConfig,
  compoHeight = 100,
  compoWidth = 100,
  fontSizeMultiplier,
  heightWeights,
  img,
  leftButtonText,
  onClickLeftButton,
  subTitle,
  title,
  isShowBothButton = true,
  note,
  onClickRightButton,
  rightButtonText,
  padding,
}: commonModalProps) => {
  const hasIcon = !!img;
  const hasNote = !!note;

  // ── Padding ──────────────────────────────────────────────────────────
  const outerPadding = adjustSizeToResolveZoomInIssue(
    compoHeight * (padding ?? 0.08),
  );

  // ── Usable height ────────────────────────────────────────────────────
  const usableHeight = Math.max(0, compoHeight - outerPadding * 2);

  // ── Weights ──────────────────────────────────────────────────────────
  const weights = {
    img: heightWeights?.img ?? 0.28,
    title: heightWeights?.title ?? 0.15,
    subTitle: heightWeights?.subTitle ?? 0.27,
    buttons: heightWeights?.buttons ?? 0.15,
    note: heightWeights?.note ?? 0.15,
  };

  const totalWeight =
    (hasIcon ? weights.img : 0) +
    weights.title +
    weights.subTitle +
    weights.buttons +
    (hasNote ? weights.note : 0);

  const sectionHeight = (weight: number) =>
    adjustSizeToResolveZoomInIssue((weight / totalWeight) * usableHeight);

  // ── Image size & box height ──────────────────────────────────────────
  // imgSize is driven by fontSizeMultiplier.imgSize (capped to the weight-
  // pool allocation so it never overflows).
  // imgBoxHeight matches imgSize exactly — the box shrinks with the image.
  // Any height freed compared to the pool allocation is collected in
  // `freedImgHeight` and added to subTitleBoxHeight, so the space is never
  // wasted.
  const pooledImgHeight = hasIcon ? sectionHeight(weights.img) : 0;

  const imgSize = hasIcon
    ? Math.min(
        pooledImgHeight,
        adjustSizeToResolveZoomInIssue(
          compoHeight * (fontSizeMultiplier?.imgSize ?? 0.16) ,
        ),
      )
    : 0;

  // Box hugs the image — no leftover gap inside the icon row.
  const imgBoxHeight = imgSize * 1.2;

  // Height saved by shrinking the image box vs. what the pool had reserved.
  const freedImgHeight = pooledImgHeight - imgBoxHeight;

  // ── Other section heights ────────────────────────────────────────────
  const titleBoxHeight = sectionHeight(weights.title);

  // Freed height from the image box flows into subTitle so total always
  // sums to usableHeight.
  const subTitleBoxHeight = sectionHeight(weights.subTitle) + freedImgHeight;

  const buttonsBoxHeight = sectionHeight(weights.buttons);
  const noteBoxHeight = hasNote ? sectionHeight(weights.note) : 0;

  // ── Font / radius sizes ──────────────────────────────────────────────
  const titleSize = adjustSizeToResolveZoomInIssue(
    compoHeight * (fontSizeMultiplier?.titleTextSize ?? 0.05),
  );
  const subTitleSize = adjustSizeToResolveZoomInIssue(
    compoHeight * (fontSizeMultiplier?.subTitleTextSize ?? 0.045),
  );
  const buttonTextSize = adjustSizeToResolveZoomInIssue(
    compoHeight * (fontSizeMultiplier?.buttonTextSize ?? 0.04),
  );
  const noteTextSize = adjustSizeToResolveZoomInIssue(
    compoHeight * (fontSizeMultiplier?.noteTextSize ?? 0.032),
  );
  const borderRadius = adjustSizeToResolveZoomInIssue(
    compoHeight * (fontSizeMultiplier?.borderRadius ?? 0.04),
  );

  return (
    isModalOpen && (
      <Box
        position={"absolute"}
        justifyContent={"center"}
        alignItems={"center"}
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={999}
        backgroundColor={backDropColor ?? "rgba(0,0,0,0.2)"}
      >
        <Box
          width={compoWidth}
          height={compoHeight}
          bg={colorConfig?.bgColor ?? "white"}
          rounded={borderRadius}
          justifyContent={"center"}
          alignItems={"center"}
          shadow={3}
        >
          <VStack
            width={"100%"}
            height={"100%"}
            px={outerPadding}
            py={outerPadding}
            justifyContent={"center"}
            alignItems={"center"}
          >
            {/* ── Icon ── */}
            {hasIcon && (
              <Box
                width={"100%"}
                height={imgBoxHeight}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Image
                  source={img}
                  width={imgSize}
                  height={imgSize}
                  resizeMode="contain"
                  alt="modal-icon"
                />
              </Box>
            )}

            {/* ── Title ── */}
            <Box
              width={"100%"}
              height={titleBoxHeight}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Text
                fontSize={titleSize}
                fontWeight="700"
                color={colorConfig?.titleColor ?? "coolGray.900"}
                textAlign="center"
              >
                {title}
              </Text>
            </Box>

            {/* ── Subtitle ── */}
            <Box
              width={"100%"}
              height={subTitleBoxHeight}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Text
                fontSize={subTitleSize}
                color={colorConfig?.subTitleColor ?? "coolGray.500"}
                textAlign="center"
              >
                {subTitle}
              </Text>
            </Box>

            {/* ── Note ── */}
            {hasNote && (
              <Box
                width={"100%"}
                height={noteBoxHeight}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Text
                  fontSize={noteTextSize}
                  color={colorConfig?.noteTextColor ?? "coolGray.400"}
                  textAlign="center"
                >
                  {note}
                </Text>
              </Box>
            )}

            {/* ── Buttons ── */}
            <Box
              width={"100%"}
              height={buttonsBoxHeight}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <HStack width={"100%"} space={"4%"} justifyContent={"center"}>
                <Pressable
                  flex={1}
                  height={adjustSizeToResolveZoomInIssue(
                    buttonsBoxHeight * 0.9,
                  )}
                  py={adjustSizeToResolveZoomInIssue(buttonsBoxHeight * 0.1)}
                  px={adjustSizeToResolveZoomInIssue(buttonsBoxHeight * 0.2)}
                  bg={colorConfig?.leftButtonBgColor ?? "coolGray.100"}
                  rounded={borderRadius * 0.6}
                  justifyContent={"center"}
                  alignItems={"center"}
                  onPress={onClickLeftButton}
                  _pressed={{
                    bgColor:
                      colorConfig?.onPressLeftButtonBgColor ?? "coolGray.300",
                  }}
                >
                  <Text
                    fontSize={buttonTextSize}
                    fontWeight="600"
                    color={colorConfig?.leftButtonTextColor ?? "coolGray.700"}
                  >
                    {leftButtonText}
                  </Text>
                </Pressable>

                {isShowBothButton && (
                  <Pressable
                    height={adjustSizeToResolveZoomInIssue(
                      buttonsBoxHeight * 0.9,
                    )}
                    py={adjustSizeToResolveZoomInIssue(buttonsBoxHeight * 0.1)}
                    px={adjustSizeToResolveZoomInIssue(buttonsBoxHeight * 0.2)}
                    bg={colorConfig?.rightButtonBgColor ?? "indigo.500"}
                    rounded={borderRadius * 0.6}
                    justifyContent={"center"}
                    alignItems={"center"}
                    onPress={onClickRightButton}
                    _pressed={{
                      bgColor:
                        colorConfig?.onPressRightButtonBgColor ?? "indigo.700",
                    }}
                  >
                    <Text
                      fontSize={buttonTextSize}
                      fontWeight="600"
                      color={colorConfig?.rightButtonTextColor ?? "white"}
                    >
                      {rightButtonText}
                    </Text>
                  </Pressable>
                )}
              </HStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    )
  );
};

export default CommonModel;
