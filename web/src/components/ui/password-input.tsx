import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PasswordInputProps extends React.ComponentProps<"input"> {
    containerClassName?: string
}

export function PasswordInput({ className, containerClassName, ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className={cn("relative", containerClassName)}>
            <Input
                type={showPassword ? "text" : "password"}
                className={cn("pr-10", className)}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
            >
                {showPassword ? (
                    <EyeOff className="size-4" />
                ) : (
                    <Eye className="size-4" />
                )}
            </button>
        </div>
    )
}