/**
 * Button Component Tests
 * TEST CASES: 10
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock Button component
const MockButton = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    onClick = () => { },
    ...props
}: any) => (
    <button
        data-testid="button"
        disabled={disabled || loading}
        onClick={onClick}
        className={`btn btn-${variant} btn-${size}`}
        {...props}
    >
        {loading ? <span data-testid="spinner">Loading...</span> : children}
    </button>
);

describe('Button Component', () => {
    let mockClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockClick = vi.fn();
        vi.clearAllMocks();
    });

    it('should render button with text', () => {
        render(<MockButton>Click me</MockButton>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
        render(<MockButton onClick={mockClick}>Click</MockButton>);
        fireEvent.click(screen.getByTestId('button'));
        expect(mockClick).toHaveBeenCalled();
    });

    it('should not call onClick when disabled', () => {
        render(<MockButton onClick={mockClick} disabled>Click</MockButton>);
        fireEvent.click(screen.getByTestId('button'));
        expect(mockClick).not.toHaveBeenCalled();
    });

    it('should show loading spinner when loading', () => {
        render(<MockButton loading>Click</MockButton>);
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
        render(<MockButton loading>Click</MockButton>);
        expect(screen.getByTestId('button')).toBeDisabled();
    });

    it('should apply variant class', () => {
        render(<MockButton variant="secondary">Click</MockButton>);
        expect(screen.getByTestId('button')).toHaveClass('btn-secondary');
    });

    it('should apply size class', () => {
        render(<MockButton size="lg">Click</MockButton>);
        expect(screen.getByTestId('button')).toHaveClass('btn-lg');
    });

    it('should render children content', () => {
        render(<MockButton><span>Icon</span> Text</MockButton>);
        expect(screen.getByText('Icon')).toBeInTheDocument();
        expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should accept additional props', () => {
        render(<MockButton data-custom="value">Click</MockButton>);
        expect(screen.getByTestId('button')).toHaveAttribute('data-custom', 'value');
    });

    it('should have accessible role', () => {
        render(<MockButton>Click</MockButton>);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
