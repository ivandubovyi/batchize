"use client"

import * as React from "react"
import SkyToggle from "@/components/ui/sky-toggle"

interface FooterProps {
  isDarkMode: boolean
  onToggleDarkMode: (dark: boolean) => void
}

function Footerdemo({ isDarkMode, onToggleDarkMode }: FooterProps) {
  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Batchize</h2>
            <p className="mb-6 text-muted-foreground">
              Write your YC application, check every answer, and drill the
              interview. Everything runs and saves in your own browser.
            </p>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <nav className="space-y-2 text-sm">
              <a href="#/" className="block transition-colors hover:text-primary">
                Home
              </a>
              <a href="#features" className="block transition-colors hover:text-primary">
                Features
              </a>
              <a href="#faq" className="block transition-colors hover:text-primary">
                FAQ
              </a>
              <a
                href={`${import.meta.env.BASE_URL}questions/`}
                className="block transition-colors hover:text-primary"
              >
                All 26 questions, explained
              </a>
              <a href="#/app" className="block transition-colors hover:text-primary">                Open the App
              </a>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Good to know</h3>
            <p className="space-y-2 text-sm not-italic text-muted-foreground">
              Your application is saved in this browser only. Clearing your
              browser data will delete it.
            </p>
          </div>
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">Appearance</h3>
            <div className="flex items-center space-x-2">
              <SkyToggle checked={isDarkMode} onChange={onToggleDarkMode} />
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 Batchize. Independent demo, not affiliated with or endorsed
            by Y Combinator.
          </p>
          <p className="text-sm text-muted-foreground">
            Nothing you write is uploaded or stored on a server.
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo }
