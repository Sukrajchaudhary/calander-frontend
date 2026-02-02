"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const toastVariants = cva(
      "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all duration-300 ease-out",
      {
            variants: {
                  variant: {
                        default: "border-border bg-card text-foreground",
                        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                        error: "border-red-500/30 bg-red-500/10 text-red-400",
                        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
                        info: "border-sky-500/30 bg-sky-500/10 text-sky-400",
                  },
            },
            defaultVariants: {
                  variant: "default",
            },
      }
)

export interface ToastProps extends VariantProps<typeof toastVariants> {
      id: string
      title: string
      description?: string
      onClose: (id: string) => void
}

const toastIcons = {
      default: null,
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info,
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
      const Icon = toastIcons[variant || "default"]

      React.useEffect(() => {
            const timer = setTimeout(() => {
                  onClose(id)
            }, 5000)

            return () => clearTimeout(timer)
      }, [id, onClose])

      return (
            <div
                  className={cn(
                        toastVariants({ variant }),
                        "animate-in slide-in-from-bottom-full fade-in-0 duration-300"
                  )}
                  role="alert"
            >
                  <div className="flex items-start gap-3">
                        {Icon && <Icon className="h-5 w-5 shrink-0 mt-0.5" />}
                        <div className="grid gap-1 flex-1 min-w-0">
                              <div className="text-sm font-semibold">{title}</div>
                              {description && (
                                    <div className="text-sm opacity-80 whitespace-pre-line break-words">
                                          {description}
                                    </div>
                              )}
                        </div>
                  </div>
                  <button
                        onClick={() => onClose(id)}
                        className="absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                  </button>
            </div>
      )
}

// Toast container component
interface ToastContainerProps {
      toasts: ToastData[]
      onClose: (id: string) => void
}

export interface ToastData {
      id: string
      title: string
      description?: string
      variant?: "default" | "success" | "error" | "warning" | "info"
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
      return (
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 w-full max-w-md">
                  {toasts.map((toast) => (
                        <Toast
                              key={toast.id}
                              id={toast.id}
                              title={toast.title}
                              description={toast.description}
                              variant={toast.variant}
                              onClose={onClose}
                        />
                  ))}
            </div>
      )
}
