"use client"

import { useEffect, useRef } from "react"

/**
 * VideoCallHubProvider - Simplified version
 * Video call events are handled through ChatHubProvider
 * This provider is kept for potential future video call specific logic
 */

export function VideoCallHubProvider({ children }: { children: React.ReactNode }) {
    const isComponentMountedRef = useRef(true)

    useEffect(() => {
        isComponentMountedRef.current = true
        // Video call events are handled by ChatHubProvider

        return () => {
            isComponentMountedRef.current = false
        }
    }, [])

    return <>{children}</>
}


