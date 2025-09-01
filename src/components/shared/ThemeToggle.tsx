// components/shared/ThemeToggle.tsx
"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Tránh hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className="bg-transparent border-2 border-cyan-400/50"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg bg-transparent hover:bg-[#ad46ff]/20 text-[#ad46ff] hover:text-[#ad46ff]/80 transition-all duration-200"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          Sáng
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          Tối
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          Hệ thống
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
