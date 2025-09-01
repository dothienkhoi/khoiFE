"use client"

import { usePageLoading } from "@/hooks/usePageLoading"
import { LoadingScreen } from "@/components/ui/LoadingScreen"

interface LoadingProviderProps {
    children: React.ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
    const { isLoading } = usePageLoading()

    return (
        <>
            <LoadingScreen isLoading={isLoading} />
            {children}
        </>
    )
}


