import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';

// Create a simple dummy component to verify the test suite works
const SimpleButton = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => {
  return <button onClick={onClick} data-testid="simple-btn">{children}</button>;
};

describe('Simple Component Engine', () => {
  it('mounts without crashing and displays text', () => {
    render(<SimpleButton>Click Me</SimpleButton>);
    const buttonElement = screen.getByTestId('simple-btn');
    
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveTextContent('Click Me');
  });
});
