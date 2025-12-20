import * as React from "react"
import { cn } from "@/lib/utils"

interface ColorPickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2 w-full">
                {label && (
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {label}
                    </label>
                )}
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        className={cn(
                            "h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
            </div>
        )
    }
)
ColorPicker.displayName = "ColorPicker"

export { ColorPicker }
