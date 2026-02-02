import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
      extends React.InputHTMLAttributes<HTMLInputElement> {
      icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
      ({ className, type, icon, ...props }, ref) => {
            if (icon) {
                  return (
                        <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {icon}
                              </span>
                              <input
                                    type={type}
                                    className={cn(
                                          "flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm transition-all duration-200",
                                          "placeholder:text-muted-foreground",
                                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                          "disabled:cursor-not-allowed disabled:opacity-50",
                                          className
                                    )}
                                    ref={ref}
                                    {...props}
                              />
                        </div>
                  )
            }

            return (
                  <input
                        type={type}
                        className={cn(
                              "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-200",
                              "placeholder:text-muted-foreground",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                              className
                        )}
                        ref={ref}
                        {...props}
                  />
            )
      }
)
Input.displayName = "Input"

export { Input }
