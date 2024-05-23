import { Anchor, Badge, Box, Card, Center, Container, Flex, Group, Image, LoadingOverlay, Pagination, Table, Text, TextInput, Title } from "@mantine/core";
import {VentureCapitalist } from "@trieve-openvc/schemas";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json())
// I did not find a way to programmatically get the total number of chunks.
// I checked the YC example and notice you implemented infinity scrolling to overcome this.
const TOTAL_CHUNKS = 1000
const PAGE_SIZE = 10

export default function IndexPage() {
  const [query, setQuery] = useState<string>('idea')
  const [page, setPage] = useState<number>(1)
  const { data, isLoading } = useSWR(query ? `/api/search?query=${query}&page=${page}` : null, fetcher)

  return (
    <Container>
      <Flex mih={'100vh'} direction={'column'} gap={'xl'} p={'xl'}>
        <Center>
          <Title>OpenVC</Title>
        </Center>
        <TextInput value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
        <Box flex={1} pos={'relative'}>
          <LoadingOverlay visible={isLoading} color={'black'} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'black', type: 'bars' }} />
          <Flex direction={'column'} gap={'xl'}>
            {data?.map(({link, metadata: vc}: {link: string, metadata: VentureCapitalist}) => (
              <Card component="a" href={link} target="_blank" key={link} shadow="sm" padding={'xl'}>
                <Flex  direction={'row'} align={'center'} gap={'xl'}>
                  <Image width={100} height={100} src={vc.logo} alt={vc.name} />
                  <Flex direction={'column'} gap={'sm'}>
                    <Text fw={'bold'}>{vc.name}</Text>
                    {!!vc.description && <Text>{vc.description}</Text>}
                    {!!vc.countries && <Flex wrap={'wrap'} direction={'row'} gap={'xs'}>{vc.countries.slice(0, 10).map(country => <Badge color="black" key={country}>{country}</Badge>)}</Flex>}
                    {!!vc.check && <Text fw={'bold'}>{vc.check}</Text>}
                    {!!vc.stages && <Flex direction={'row'} gap={'xs'}>{vc.stages.map(stage => <Badge color="black" key={stage}>{stage}</Badge>)}</Flex>}
                    {!!vc.thesis && <Text>{vc.thesis}</Text>}
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Box>
        <Center>
          {data?.length && <Pagination color="black" total={TOTAL_CHUNKS / PAGE_SIZE} value={page} onChange={setPage} />}
        </Center>
      </Flex>
    </Container>
  );
}
