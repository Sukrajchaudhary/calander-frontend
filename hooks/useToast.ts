"use client"

import { useState, useCallback } from "react"
import type { ToastData } from "@/components/ui/toast"

let toastId = 0

export function useToast() {
      const [toasts, setToasts] = useState<ToastData[]>([])

      const addToast = useCallback((toast: Omit<ToastData, "id">) => {
            const id = `toast-${++toastId}`
            setToasts((prev) => [...prev, { ...toast, id }])
            return id
      }, [])

      const removeToast = useCallback((id: string) => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, [])

      const success = useCallback(
            (title: string, description?: string) => {
                  return addToast({ title, description, variant: "success" })
            },
            [addToast]
      )

      const error = useCallback(
            (title: string, description?: string) => {
                  return addToast({ title, description, variant: "error" })
            },
            [addToast]
      )

      const warning = useCallback(
            (title: string, description?: string) => {
                  return addToast({ title, description, variant: "warning" })
            },
            [addToast]
      )

      const info = useCallback(
            (title: string, description?: string) => {
                  return addToast({ title, description, variant: "info" })
            },
            [addToast]
      )

      return {
            toasts,
            addToast,
            removeToast,
            success,
            error,
            warning,
            info,
      }
}
