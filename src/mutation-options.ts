export interface MutationOptions<TData>{
    onSuccess?: (data: TData) => void
    onError?: (error: unknown) => void
    onSettled?: (data: TData | undefined, error: unknown) => void
    errorMessage?: string
}