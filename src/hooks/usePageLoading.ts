"use client"

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Define main navigation routes that should trigger the loading screen
const MAIN_NAVIGATION_ROUTES = ['/chat', '/communities', '/profile'];

export function usePageLoading() {
    const [isLoading, setIsLoading] = useState(false)
    const pathname = usePathname()
    const prevPathname = useRef(pathname)

    useEffect(() => {
        const currentPath = pathname
        const previousPath = prevPathname.current

        // Only show loading if pathname actually changed
        if (currentPath !== previousPath) {
            // Check if the new path is one of the main navigation routes (exact match or root level)
            const isTargetingMainRoute = MAIN_NAVIGATION_ROUTES.some(route => {
                // Exact match for main routes
                if (currentPath === route) return true

                // Check if it's a root level route (e.g., /groups, /chat) but not deeper paths
                if (currentPath.startsWith(route + '/')) return false

                return false
            })

            if (isTargetingMainRoute) {
                // Show loading screen for main navigation routes
                setIsLoading(true)

                // Simulate loading time (you can adjust this)
                const timer = setTimeout(() => {
                    setIsLoading(false)
                }, 800) // 800ms loading time

                prevPathname.current = currentPath
                return () => clearTimeout(timer)
            } else {
                // If the new path is not a main route (e.g., navigating to a specific chat/group),
                // ensure loading is false immediately as per user's request
                setIsLoading(false)
                prevPathname.current = currentPath
            }
        }
    }, [pathname])

    return { isLoading }
}
