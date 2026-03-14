import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base transition-all outline-none placeholder:text-gray-400 hover:border-gray-300 focus-visible:border-[#6c5ce7] focus-visible:ring-3 focus-visible:ring-[#6c5ce7]/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
