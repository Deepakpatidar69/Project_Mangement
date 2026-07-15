import { Spinner, Text, VStack } from "native-base";

export const PreviewList = ({ loading, data, emptyText, renderItem }: any) => {
  if (loading) return <Spinner />;

  if (!data || data.length === 0)
    return <Text color="gray.400">{emptyText}</Text>;

  return <VStack space={3}>{data.slice(0, 3).map(renderItem)}</VStack>;
};
