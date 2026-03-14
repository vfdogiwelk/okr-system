import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base transition-all outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-gray-400 hover:border-gray-300 focus-visible:border-[#6c5ce7] focus-visible:ring-3 focus-visible:ring-[#6c5ce7]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
