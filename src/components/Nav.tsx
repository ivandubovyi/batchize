import { Button } from "@/components/ui/button";
import { proVisible } from "@/lib/pro";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <a href="#/" className="text-xl font-bold tracking-tight">
          Batchize<span className="text-primary">.</span>
        </a>
        <div className="flex items-center gap-2 md:gap-4">
          <a
            href="#features"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:block"
          >
            Features
          </a>
          <a
            href="#faq"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:block"
          >
            FAQ
          </a>
          {proVisible() && (
            <a
              href="#/pricing"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:block"
            >
              Pricing
            </a>
          )}
          <Button asChild size="sm" className="rounded-full px-5">
            <a href="#/app">Get Started</a>
          </Button>
        </div>
      </div>
    </nav>
  );
}
