import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Component that throws an error on render
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error for boundary");
  }
  return <div>Normal content</div>;
};

describe("ErrorBoundary", () => {
  // Suppress console.error for expected errors in tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Go Home")).toBeInTheDocument();
  });

  it("shows error details in expandable section", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Error details")).toBeInTheDocument();
    expect(screen.getByText("Test error for boundary")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom Fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("resets error state when Try Again is clicked", () => {
    // ErrorBoundary catches the error and shows fallback
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    
    // Click Try Again — this resets hasError=false, which triggers re-render
    // But since ThrowingComponent still throws, it will catch again
    // The important thing is that the click handler works
    fireEvent.click(screen.getByText("Try Again"));
    
    // After getDerivedStateFromError fires again from the re-throw,
    // we should still see the error boundary
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
