import { Moon, Sun, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/ThemeProvider"

export function ThemeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 hover:bg-muted/50 border border-transparent hover:border-border transition-all">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-border/50 shadow-xl bg-card/90 backdrop-blur-xl">
                <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-xl cursor-pointer py-2 px-3">
                    <Sun className="mr-2 h-4 w-4" />
                    <span className="font-medium">Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-xl cursor-pointer py-2 px-3 mt-1">
                    <Moon className="mr-2 h-4 w-4" />
                    <span className="font-medium">Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-xl cursor-pointer py-2 px-3 mt-1">
                    <Monitor className="mr-2 h-4 w-4" />
                    <span className="font-medium">System Default</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
