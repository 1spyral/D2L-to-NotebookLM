import React from "react";

interface DarkModeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export function DarkModeToggle({ darkMode, onToggle }: DarkModeToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onToggle}
      className="flex h-8 shrink-0 items-center gap-1 rounded-full px-1.5 transition-colors hover:bg-outline/30 dark:hover:bg-dk-outline/30"
    >
      {/* Sun */}
      <svg
        className={`h-3.5 w-3.5 transition-colors ${!darkMode ? "text-amber-400" : "text-muted/40 dark:text-dk-muted/40"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>
      {/* Moon */}
      <svg
        className={`h-3.5 w-3.5 transition-colors ${darkMode ? "text-indigo-400" : "text-muted/40 dark:text-dk-muted/40"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    </button>
  );
}
