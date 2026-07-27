export type PageProps<
  P = Record<string, string>,
  Q = Record<string, string>,
> = {
  params: Promise<P>
  searchParams: Promise<Q>
}

export interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}