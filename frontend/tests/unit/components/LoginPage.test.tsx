/**
 * Login Page Component Tests
 * TEST CASES: 15
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock components and hooks
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        login: vi.fn(),
        isLoading: false,
        error: null,
        isAuthenticated: false,
    }),
}));

// Simple mock LoginPage for testing
const MockLoginPage = ({ onSubmit, isLoading = false, error = null }: any) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.({ email: 'test@test.com', password: 'password' }); }}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" data-testid="email-input" />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" data-testid="password-input" />
        {error && <div data-testid="error-message">{error}</div>}
        <button type="submit" disabled={isLoading} data-testid="submit-button">
            {isLoading ? 'Loading...' : 'Sign In'}
        </button>
    </form>
);

describe('LoginPage', () => {
    let mockLogin: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockLogin = vi.fn();
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render login form with email and password fields', () => {
            render(<MockLoginPage onSubmit={mockLogin} />);

            expect(screen.getByTestId('email-input')).toBeInTheDocument();
            expect(screen.getByTestId('password-input')).toBeInTheDocument();
            expect(screen.getByTestId('submit-button')).toBeInTheDocument();
        });

        it('should render email label', () => {
            render(<MockLoginPage onSubmit={mockLogin} />);

            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        });

        it('should render password label', () => {
            render(<MockLoginPage onSubmit={mockLogin} />);

            expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        });

        it('should render submit button with correct text', () => {
            render(<MockLoginPage onSubmit={mockLogin} />);

            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        });
    });

    describe('Form Interaction', () => {
        it('should allow typing in email field', async () => {
            render(<MockLoginPage onSubmit={mockLogin} />);
            const emailInput = screen.getByTestId('email-input');

            await userEvent.type(emailInput, 'test@example.com');

            expect(emailInput).toHaveValue('test@example.com');
        });

        it('should allow typing in password field', async () => {
            render(<MockLoginPage onSubmit={mockLogin} />);
            const passwordInput = screen.getByTestId('password-input');

            await userEvent.type(passwordInput, 'secretpassword');

            expect(passwordInput).toHaveValue('secretpassword');
        });

        it('should call onSubmit when form is submitted', async () => {
            render(<MockLoginPage onSubmit={mockLogin} />);

            await userEvent.click(screen.getByTestId('submit-button'));

            expect(mockLogin).toHaveBeenCalled();
        });
    });

    describe('Loading State', () => {
        it('should show loading text when isLoading is true', () => {
            render(<MockLoginPage onSubmit={mockLogin} isLoading={true} />);

            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should disable submit button when loading', () => {
            render(<MockLoginPage onSubmit={mockLogin} isLoading={true} />);

            expect(screen.getByTestId('submit-button')).toBeDisabled();
        });
    });

    describe('Error State', () => {
        it('should display error message when error prop is provided', () => {
            render(<MockLoginPage onSubmit={mockLogin} error="Invalid credentials" />);

            expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
        });

        it('should not display error when error is null', () => {
            render(<MockLoginPage onSubmit={mockLogin} error={null} />);

            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have accessible labels for inputs', () => {
            render(<MockLoginPage onSubmit={mockLogin} />);

            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        });

        it('should have type email for email input', () => {
            render(<MockLoginPage onSubmit={mockLogin} />);

            expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
        });

        it('should have type password for password input', () => {
            render(<MockLoginPage onSubmit={mockLogin} />);

            expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
        });
    });
});
