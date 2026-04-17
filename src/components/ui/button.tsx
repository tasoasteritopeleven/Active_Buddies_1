import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-bg-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-accent text-accent-fg hover:opacity-90": variant === "default",
            "bg-red-500 text-white hover:bg-red-600": variant === "destructive",
            "border border-border-base bg-transparent hover:bg-bg-surface-hover hover:text-text-base": variant === "outline",
            "bg-bg-surface-hover text-text-base hover:opacity-90": variant === "secondary",
            "hover:bg-bg-surface-hover hover:text-text-base": variant === "ghost",
            "text-accent underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-6": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
