"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-base font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-[#6c5ce7]/20 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-[#6c5ce7] text-white hover:bg-[#5a4bd6] shadow-sm",
        outline:
          "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200",
        ghost:
          "hover:bg-gray-100 text-gray-500 hover:text-gray-700",
        destructive:
          "bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-200",
        link: "text-[#6c5ce7] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5",
        xs: "h-8 gap-1.5 px-3 text-sm rounded-lg [&_svg:not([class*='size-'])]:size-4",
        sm: "h-9 gap-1.5 px-4 text-sm rounded-lg [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-10",
        "icon-xs": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
