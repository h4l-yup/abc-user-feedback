/* */
import { O } from 'ts-toolbelt'
import type { UseQueryOptions } from 'react-query'
import { useQuery } from 'react-query'

/* */
import { OAIMethodPathKeys, OAIParameters, OAIResponse } from '@/client/types'

export const getRequestUrl = (
  queryKey: string,
  variables?: Record<string, unknown>
) => {
  let url = `${queryKey}`

  const paramKeys = (queryKey.match(/{[a-zA-z-]+}/g) ?? []).map((param) =>
    param.replace(/[{}]/g, '')
  )

  paramKeys.forEach((param) => {
    url = url.replace(`{${param}}`, variables?.[param] as string)
  })

  const qs = new URLSearchParams(
    Object.entries(variables ?? {}).reduce((current, [key, value]) => {
      if (paramKeys.includes(key)) {
        return current
      }

      return {
        ...current,
        [key]: value
      }
    }, {})
  ).toString()

  if (qs) {
    url = `${url}?${qs}`
  }

  return url
}

export default function useOAIQuery<
  TQueryKey extends OAIMethodPathKeys<'get'>,
  TVariables extends OAIParameters<TQueryKey, 'get'>,
  TData extends OAIResponse<TQueryKey, 'get'>
>({
  queryKey,
  queryOptions,
  variables
}: {
  queryKey: TQueryKey
  queryOptions?: Omit<
    UseQueryOptions<
      TData,
      unknown,
      TData,
      (Record<string, unknown> | TQueryKey | undefined)[]
    >,
    'queryKey' | 'queryFn'
  >
} & (TVariables extends undefined
  ? {
      variables?: undefined
    }
  : O.RequiredKeys<NonNullable<TVariables>> extends never
  ? {
      variables?: TVariables
    }
  : {
      variables: TVariables
    })) {
  const keys = [queryKey, variables]
  return {
    ...useQuery(
      keys,
      async ({ signal }: any) => {
        const response = await fetch(getRequestUrl(queryKey, variables), {
          signal
        })

        if (!response.ok) {
          throw new Error('Response error')
        }

        const json = (await response.json()) as TData
        return json
      },
      queryOptions
    ),
    queryKey: keys
  }
}
